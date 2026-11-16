/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { LIVE_BASE_PATH, LIVE_BASE_URL } from "@plane/constants";
import { setToast } from "@plane/blocks/toast";
import { CollaborativeDocumentEditorWithRef, DocumentEditorWithRef } from "@plane/editor";
import {
  convertBinaryDataToBase64String,
  getBinaryDataFromDocumentEditorHTMLString,
} from "@plane/editor";
import type {
  CollaborationState,
  EditorRefApi,
  EditorTitleRefApi,
  TDisplayConfig,
  TFileHandler,
  TRealtimeConfig,
  TServerHandler,
} from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import type {
  TDocumentPayload,
  TSearchEntityRequestPayload,
  TSearchResponse,
  TWebhookConnectionQueryParams,
} from "@plane/types";
import { ERowVariant, Row } from "@plane/blocks/layout";
import { cn, generateRandomColor, hslToHex } from "@plane/utils";
// components
import { EditorMentionsRoot } from "@/components/editor/embeds/mentions";
// hooks
import { useEditorMention } from "@/hooks/editor";
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";
import { usePageFilters } from "@/hooks/use-page-filters";
import { useParseEditorContent } from "@/hooks/use-parse-editor-content";
// plane web imports
import type { TCustomEventHandlers } from "@/hooks/use-realtime-page-events";
import { useRealtimePageEvents } from "@/hooks/use-realtime-page-events";
import type { TExtendedEditorExtensionsConfig } from "@/hooks/pages";
import type { EPageStoreType } from "@/hooks/store";
import { useEditorFlagging } from "@/hooks/use-editor-flagging";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageContentLoader } from "../loaders/page-content-loader";
import { PageEditorHeaderRoot } from "./header";
import { PageContentBrowser } from "./summary";

export type TEditorBodyConfig = {
  fileHandler: TFileHandler;
};

export type TEditorBodyHandlers = {
  fetchEntity: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  getRedirectionLink: (pageId?: string) => string;
  updateDescription: (data: TDocumentPayload) => Promise<void>;
};

type Props = {
  config: TEditorBodyConfig;
  editorReady: boolean;
  editorForwardRef: React.RefObject<EditorRefApi | null>;
  handleEditorReady: (status: boolean) => void;
  handleOpenNavigationPane: () => void;
  handlers: TEditorBodyHandlers;
  isNavigationPaneOpen: boolean;
  page: TPageInstance;
  webhookConnectionParams: TWebhookConnectionQueryParams;
  projectId?: string;
  workspaceSlug: string;
  storeType: EPageStoreType;
  customRealtimeEventHandlers?: TCustomEventHandlers;
  extendedEditorProps: TExtendedEditorExtensionsConfig;
  isFetchingFallbackBinary?: boolean;
  onCollaborationStateChange?: (state: CollaborationState) => void;
};

/**
 * Builds the collaboration WebSocket config from `window.location`. Web is a client-only app
 * (`ssr: false` in react-router.config.ts), so this never runs without a window, and the first
 * render already gets the config instead of switching to it after mount.
 */
function buildRealtimeConfig(webhookConnectionParams: TWebhookConnectionQueryParams): TRealtimeConfig | undefined {
  // 没有配置 live 服务时不要退化到当前站点：那会连到不存在的 /live/collaboration，
  // 重试失败后编辑器会一直显示“连接已断开”。
  if (!LIVE_BASE_URL?.trim()) return undefined;

  // Construct the WebSocket Collaboration URL
  try {
    const LIVE_SERVER_BASE_URL = LIVE_BASE_URL.trim();
    const WS_LIVE_URL = new URL(LIVE_SERVER_BASE_URL);
    const isSecureEnvironment = window.location.protocol === "https:";
    WS_LIVE_URL.protocol = isSecureEnvironment ? "wss" : "ws";
    WS_LIVE_URL.pathname = `${LIVE_BASE_PATH}/collaboration`;

    // Append query parameters to the URL
    Object.entries(webhookConnectionParams)
      .filter(([_, value]) => value !== undefined && value !== null)
      .forEach(([key, value]) => {
        WS_LIVE_URL.searchParams.set(key, String(value));
      });

    // Construct realtime config
    return {
      url: WS_LIVE_URL.toString(),
    };
  } catch (error) {
    console.error("Error creating realtime config", error);
    return undefined;
  }
}

export const PageEditorBody = observer(function PageEditorBody(props: Props) {
  const {
    config,
    editorForwardRef,
    handleEditorReady,
    handleOpenNavigationPane,
    handlers,
    isNavigationPaneOpen,
    page,
    storeType,
    webhookConnectionParams,
    projectId,
    workspaceSlug,
    extendedEditorProps,
    isFetchingFallbackBinary,
    onCollaborationStateChange,
  } = props;
  // refs
  const titleEditorRef = useRef<EditorTitleRefApi>(null);
  // store hooks
  const { data: currentUser } = useUser();
  const { getWorkspaceBySlug } = useWorkspace();
  const { getUserDetails } = useMember();
  // derived values
  const {
    id: pageId,
    isContentEditable,
    editor: { editorRef, updateAssetsList },
    setSyncingStatus,
  } = page;
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id ?? "";
  // use editor mention
  const { fetchMentions } = useEditorMention({
    enableAdvancedMentions: true,
    searchEntity: handlers.fetchEntity,
  });
  // editor flaggings
  const { document: documentEditorExtensions } = useEditorFlagging({
    workspaceSlug,
    projectId,
    storeType,
  });
  // parse content
  const { getEditorMetaData } = useParseEditorContent({
    projectId,
    workspaceSlug,
  });
  // page filters
  const { fontSize, fontStyle, isFullWidth } = usePageFilters();
  // translation
  const { t } = useTranslation();
  // derived values
  const displayConfig: TDisplayConfig = useMemo(
    () => ({
      fontSize,
      fontStyle,
      wideLayout: isFullWidth,
    }),
    [fontSize, fontStyle, isFullWidth]
  );

  // Use the new hook to handle page events
  const { updatePageProperties } = useRealtimePageEvents({
    storeType,
    page,
    getUserDetails,
    handlers,
  });

  // Set syncing status when page changes and reset collaboration state
  useEffect(() => {
    setSyncingStatus("syncing");
    onCollaborationStateChange?.({
      stage: { kind: "connecting" },
      isServerSynced: false,
      isServerDisconnected: false,
    });
  }, [pageId, setSyncingStatus, onCollaborationStateChange]);

  const serverHandler: TServerHandler = useMemo(
    () => ({
      onStateChange: (state) => {
        // Pass full state to parent
        onCollaborationStateChange?.(state);

        // Map collaboration stage to UI syncing status
        // Stage → UI mapping: disconnected → error | synced → synced | all others → syncing
        if (state.stage.kind === "disconnected") {
          setSyncingStatus("error");
        } else if (state.stage.kind === "synced") {
          setSyncingStatus("synced");
        } else {
          // initial, connecting, awaiting-sync, reconnecting → show as syncing
          setSyncingStatus("syncing");
        }
      },
    }),
    [setSyncingStatus, onCollaborationStateChange]
  );

  const realtimeConfig = useMemo(() => buildRealtimeConfig(webhookConnectionParams), [webhookConnectionParams]);
  const hasCollaborationServer = Boolean(LIVE_BASE_URL?.trim());
  const localSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localTitle, setLocalTitle] = useState(page.name ?? "");
  const [localSaveStatus, setLocalSaveStatus] = useState<"saving" | "saved" | "error">("saved");

  useEffect(() => setLocalTitle(page.name ?? ""), [page.name]);

  const commitLocalTitle = () => {
    const nextTitle = localTitle.trim();
    if (nextTitle && nextTitle !== page.name) void page.update({ name: nextTitle });
  };

  const persistLocalDocument = useCallback(
    async (json: object, html: string) => {
      try {
        setLocalSaveStatus("saving");
        const binary = getBinaryDataFromDocumentEditorHTMLString(html, page.name ?? "");
        await handlers.updateDescription({
          description_binary: convertBinaryDataToBase64String(binary),
          description_html: html,
          description_json: json,
        });
        setLocalSaveStatus("saved");
        setSyncingStatus("synced");
      } catch (error) {
        setLocalSaveStatus("error");
        setSyncingStatus("error");
        setToast({
          type: "error",
          title: t("error"),
          message: error instanceof Error ? error.message : t("something_went_wrong"),
        });
      }
    },
    [handlers, page.name, setSyncingStatus, t]
  );

  const handleLocalDocumentChange = useCallback(
    (json: object, html: string) => {
      if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current);
      setLocalSaveStatus("saving");
      localSaveTimerRef.current = setTimeout(() => void persistLocalDocument(json, html), 800);
    },
    [persistLocalDocument]
  );

  useEffect(
    () => () => {
      if (localSaveTimerRef.current) clearTimeout(localSaveTimerRef.current);
    },
    []
  );

  useEffect(() => {
    if (!hasCollaborationServer) {
      setSyncingStatus("synced");
      onCollaborationStateChange?.({
        stage: { kind: "synced" },
        isServerSynced: true,
        isServerDisconnected: false,
      });
    }
  }, [hasCollaborationServer, onCollaborationStateChange, setSyncingStatus]);

  const userConfig = useMemo(
    () => ({
      id: currentUser?.id ?? "",
      name: currentUser?.display_name ?? "",
      color: hslToHex(generateRandomColor(currentUser?.id ?? "")),
    }),
    [currentUser?.display_name, currentUser?.id]
  );

  const blockWidthClassName = cn(
    "mx-auto block w-full max-w-[720px] bg-transparent transition-all duration-200 ease-in-out",
    {
      "max-w-[1152px]": isFullWidth,
    }
  );

  const isPageLoading = pageId === undefined;

  if (isPageLoading) return <PageContentLoader className={blockWidthClassName} />;

  return (
    <Row
      className="vertical-scrollbar relative scrollbar-md flex size-full flex-col overflow-x-hidden overflow-y-auto duration-200"
      variant={ERowVariant.HUGGING}
    >
      <div id="page-content-container" className="relative w-full flex-shrink-0">
        {/* table of content */}
        {!isNavigationPaneOpen && (
          <div className="page-summary-container pointer-events-none absolute top-[64px] right-0 z-[5] h-full">
            <div className="pointer-events-auto sticky top-[72px]">
              <div className="group/page-toc relative px-page-x">
                {/* oxlint-disable-next-line jsx_a11y/click-events-have-key-events */}
                <div
                  className="max-h-[50vh] !cursor-pointer overflow-hidden"
                  // oxlint-disable-next-line jsx_a11y/prefer-tag-over-role
                  role="button"
                  aria-label={t("page_navigation_pane.outline_floating_button")}
                  onClick={handleOpenNavigationPane}
                >
                  <PageContentBrowser className="overflow-y-auto" editorRef={editorRef} showOutline />
                </div>
                <div className="vertical-scrollbar pointer-events-none absolute top-0 right-0 scrollbar-sm max-h-[70vh] w-52 translate-x-1/2 overflow-y-scroll rounded-sm bg-surface-2 p-4 whitespace-nowrap opacity-0 transition-all duration-300 group-hover/page-toc:pointer-events-auto group-hover/page-toc:-translate-x-1/4 group-hover/page-toc:opacity-100">
                  <PageContentBrowser className="overflow-y-auto" editorRef={editorRef} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div>
          <div className="page-header-container group/page-header">
            <div className={blockWidthClassName}>
              <PageEditorHeaderRoot page={page} projectId={projectId} />
            </div>
          </div>
          {hasCollaborationServer ? (
            <CollaborativeDocumentEditorWithRef
              editable={isContentEditable}
              id={pageId}
              fileHandler={config.fileHandler}
              handleEditorReady={handleEditorReady}
              ref={editorForwardRef}
              titleRef={titleEditorRef}
              containerClassName="h-full p-0 pb-64"
              displayConfig={displayConfig}
              getEditorMetaData={getEditorMetaData}
              mentionHandler={{
                searchCallback: async (query) => {
                  const res = await fetchMentions(query);
                  if (!res) throw new Error("加载提及信息失败");
                  return res;
                },
                // oxlint-disable-next-line no-shadow
                renderComponent: (props) => <EditorMentionsRoot {...props} />,
                getMentionedEntityDetails: (id: string) => ({ display_name: getUserDetails(id)?.display_name ?? "" }),
              }}
              updatePageProperties={updatePageProperties}
              realtimeConfig={realtimeConfig}
              serverHandler={serverHandler}
              user={userConfig}
              disabledExtensions={documentEditorExtensions.disabled}
              flaggedExtensions={documentEditorExtensions.flagged}
              onAssetChange={updateAssetsList}
              extendedEditorProps={extendedEditorProps}
              isFetchingFallbackBinary={isFetchingFallbackBinary}
            />
          ) : (
            <>
              <div className={blockWidthClassName}>
                <div className="flex items-end justify-between gap-3 py-3">
                  <input
                    aria-label="文档标题"
                    value={localTitle}
                    readOnly={!isContentEditable}
                    onChange={(event) => setLocalTitle(event.target.value)}
                    onBlur={commitLocalTitle}
                    className="min-w-0 flex-1 bg-transparent text-[2rem] leading-[2.375rem] font-bold tracking-[-2%] text-primary outline-none placeholder:text-tertiary"
                    placeholder="无标题"
                  />
                  <span
                    className={`shrink-0 text-xs ${
                      localSaveStatus === "error" ? "text-danger-primary" : "text-tertiary"
                    }`}
                    aria-live="polite"
                  >
                    {localSaveStatus === "saving" ? "保存中…" : localSaveStatus === "error" ? "保存失败" : "已保存"}
                  </span>
                </div>
              </div>
              <DocumentEditorWithRef
              editable={isContentEditable}
              id={pageId}
              value={page.description_html ?? "<p></p>"}
              placeholder="按 '/' 唤出命令…"
              fileHandler={config.fileHandler}
              handleEditorReady={handleEditorReady}
              ref={editorForwardRef}
              containerClassName="h-full p-0 pb-64"
              displayConfig={displayConfig}
              getEditorMetaData={getEditorMetaData}
              mentionHandler={{
                searchCallback: async (query) => {
                  const res = await fetchMentions(query);
                  if (!res) throw new Error("加载提及信息失败");
                  return res;
                },
                // oxlint-disable-next-line no-shadow
                renderComponent: (props) => <EditorMentionsRoot {...props} />,
                getMentionedEntityDetails: (id: string) => ({ display_name: getUserDetails(id)?.display_name ?? "" }),
              }}
              user={userConfig}
              disabledExtensions={documentEditorExtensions.disabled}
              flaggedExtensions={documentEditorExtensions.flagged}
              onAssetChange={updateAssetsList}
              extendedEditorProps={extendedEditorProps}
              onChange={handleLocalDocumentChange}
              />
            </>
          )}
        </div>
      </div>
    </Row>
  );
});
