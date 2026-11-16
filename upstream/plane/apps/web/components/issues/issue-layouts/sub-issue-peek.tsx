/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { AddOutline, SubWorkItemsOutline, WorkItemsOutline } from "@makeplane/propel/icons";
import { Pill } from "@makeplane/propel/components/pill";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@makeplane/propel/components/menu";
import type { TIssue } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { generateWorkItemLink } from "@plane/utils";
// components
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/modal";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
// local
import { useSubIssueOperations } from "@/components/issues/issue-detail-widgets/sub-issues/helper";

type Props = {
  issue: TIssue;
  disabled?: boolean;
  isEpic?: boolean;
};

/**
 * The sub-work-item chip doubles as the "grow this item" affordance: instead of a floating plus
 * button in the card corner, the chip in the property row opens a peek menu that lists the existing
 * children and offers to create a new one.
 */
export const SubIssuePeekChip = observer(function SubIssuePeekChip(props: Props) {
  const { issue, disabled = false, isEpic = false } = props;
  // states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Base UI restores focus to the menu trigger while it closes. Opening the dialog in the very same
  // commit let that restore fire against a dialog that had just become modal, which dropped the
  // focus and left the dialog inert. Park the request and open the dialog once the menu is gone.
  const [pendingCreate, setPendingCreate] = useState(false);
  // i18n
  const { t } = useTranslation();
  // router
  const { workspaceSlug } = useParams();
  const router = useAppRouter();
  // store hooks
  const { getProjectById } = useProject();
  const issueServiceType = isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES;
  const {
    issue: { getIssueById },
    subIssues: { subIssuesByIssueId, fetchSubIssues },
  } = useIssueDetail(issueServiceType);
  const subIssueOperations = useSubIssueOperations(issueServiceType);
  // derived values
  const project = getProjectById(issue.project_id);
  const childIds = subIssuesByIssueId(issue.id) ?? [];
  const children = childIds.map((id) => getIssueById(id)).filter((child): child is TIssue => Boolean(child));
  const count = issue.sub_issues_count ?? children.length;

  // The peek menu is the first place a card's children are needed, so load them lazily.
  useEffect(() => {
    if (!isMenuOpen || !workspaceSlug || !issue.project_id || childIds.length > 0) return;
    void fetchSubIssues(workspaceSlug.toString(), issue.project_id, issue.id);
  }, [childIds.length, fetchSubIssues, isMenuOpen, issue.id, issue.project_id, workspaceSlug]);

  // Open the create dialog only after the menu has fully closed, so the dialog owns focus.
  useEffect(() => {
    if (!pendingCreate || isMenuOpen) return;
    setPendingCreate(false);
    setIsCreateModalOpen(true);
  }, [isMenuOpen, pendingCreate]);

  const openChild = (child: TIssue) => {
    router.push(
      generateWorkItemLink({
        workspaceSlug,
        projectId: child.project_id,
        issueId: child.id,
        projectIdentifier: getProjectById(child.project_id)?.identifier,
        sequenceId: child.sequence_id,
        isArchived: !!child.archived_at,
        isEpic,
      })
    );
  };

  const handleCreateSubIssue = async (subIssue: TIssue) => {
    if (!workspaceSlug || !subIssue.parent_id || !issue.project_id) return;
    await subIssueOperations.addSubIssue(workspaceSlug.toString(), issue.project_id, subIssue.parent_id, [subIssue.id]);
  };

  return (
    <>
      {/* `fetchIssueDetails={false}` matters: without it the modal waits for an issue detail it can never
          fetch for a not-yet-created child, so the description editor stays on its skeleton and the form's
          "editor ready" gate swallows the save click. */}
      <CreateUpdateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        data={{ parent_id: issue.id, project_id: issue.project_id ?? undefined, state_id: issue.state_id ?? undefined }}
        onSubmit={handleCreateSubIssue}
        fetchIssueDetails={false}
        isProjectSelectionDisabled
      />
      <Menu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <MenuTrigger
          disabled={disabled}
          render={
            <Pill
              size="sm"
              variant="outline"
              aria-label={`${t("common.sub_work_items")}: ${count}`}
              startIcon={<SubWorkItemsOutline />}
              label={count > 0 ? `${count}` : "+"}
              disabled={disabled}
            />
          }
        />
        <MenuContent side="bottom" align="start">
          {children.length > 0 ? (
            children.map((child) => (
              <MenuItem
                key={child.id}
                icon={<WorkItemsOutline className="h-3.5 w-3.5" />}
                label={`${project?.identifier ?? ""}-${child.sequence_id} ${child.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  openChild(child);
                }}
              />
            ))
          ) : (
            <p className="px-3 py-2 text-body-xs-regular text-tertiary">还没有子工作项</p>
          )}
          <MenuSeparator />
          <MenuItem
            icon={<AddOutline className="h-3.5 w-3.5" />}
            label="新建子工作项"
            onClick={(event) => {
              event.stopPropagation();
              // Close the menu, then let the effect above open the dialog in a later commit.
              setIsMenuOpen(false);
              setPendingCreate(true);
            }}
          />
        </MenuContent>
      </Menu>
    </>
  );
});
