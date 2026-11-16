import type { ComponentType, ReactNode, SVGProps } from "react";
import { Menu, MenuContent, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "@makeplane/propel/components/menu";
import {
  AlertCircleFilled,
  AlertOctagonFilled,
  ArchiveFilled,
  BlockingFilled,
  CheckDoneFilled,
  ChevronDownFilled,
  CircleDashedFilled,
  InfoFilled,
  LayerStackFilled,
  OverdueFilled,
  PauseFilled,
  PlayFilled,
  StarFilled,
  TableFilled,
  VerifiedFilled,
  WarningTriangleFilled,
} from "@makeplane/propel/icons";
import { PriorityIcon } from "@plane/blocks/icons";
import { cn } from "@plane/utils";
import { problemKind, problemPriority, problemSeverity, problemStatus } from "@/services/problem.service";
import type { PersonalProblem } from "@/services/problem.service";

export type ProblemStatus = PersonalProblem["status"];
export type ProblemSeverity = PersonalProblem["severity"];
export type ProblemPriority = PersonalProblem["priority"];
export type ProblemKind = PersonalProblem["kind"];

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type Tone = {
  icon: IconComponent;
  /** 徽章底色，取自 Propel 背景语义 token。 */
  bg: string;
  /** 徽章图标与文字色，取自 Propel 文本语义 token。 */
  ink: string;
  /** 状态分布条使用的实心色。 */
  bar: string;
  /** 高亮描边，用于状态流转与筛选选中态。 */
  ring: string;
};

const badgeBase = "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-body-xs-medium whitespace-nowrap";

const badgeClass = (tone: Tone, className?: string) => cn(badgeBase, tone.bg, tone.ink, className);

export const STATUS_TONES: Record<ProblemStatus, Tone> = {
  open: {
    icon: CircleDashedFilled,
    bg: "bg-layer-2",
    ink: "text-secondary",
    bar: "bg-layer-3",
    ring: "border-subtle-1",
  },
  progress: {
    icon: PlayFilled,
    bg: "bg-warning-subtle",
    ink: "text-warning-primary",
    bar: "bg-warning-primary",
    ring: "border-warning-subtle",
  },
  verify: {
    icon: VerifiedFilled,
    bg: "bg-info-subtle",
    ink: "text-info-primary",
    bar: "bg-info-primary",
    ring: "border-info-subtle",
  },
  closed: {
    icon: CheckDoneFilled,
    bg: "bg-success-subtle",
    ink: "text-success-primary",
    bar: "bg-success-primary",
    ring: "border-success-subtle",
  },
  paused: {
    icon: PauseFilled,
    bg: "bg-layer-3",
    ink: "text-placeholder",
    bar: "bg-layer-3",
    ring: "border-subtle",
  },
};

export const SEVERITY_TONES: Record<ProblemSeverity, Tone> = {
  critical: {
    icon: AlertOctagonFilled,
    bg: "bg-danger-subtle",
    ink: "text-danger-primary",
    bar: "bg-danger-primary",
    ring: "border-danger-subtle",
  },
  major: {
    icon: AlertCircleFilled,
    bg: "bg-warning-subtle",
    ink: "text-warning-primary",
    bar: "bg-warning-primary",
    ring: "border-warning-subtle",
  },
  normal: {
    icon: WarningTriangleFilled,
    bg: "bg-accent-subtle",
    ink: "text-accent-primary",
    bar: "bg-accent-primary",
    ring: "border-accent-subtle",
  },
  minor: {
    icon: InfoFilled,
    bg: "bg-info-subtle",
    ink: "text-info-primary",
    bar: "bg-info-primary",
    ring: "border-info-subtle",
  },
  unknown: {
    icon: CircleDashedFilled,
    bg: "bg-layer-2",
    ink: "text-tertiary",
    bar: "bg-layer-3",
    ring: "border-subtle",
  },
};

export const KIND_TONES: Record<ProblemKind, Tone> = {
  defect: {
    icon: AlertCircleFilled,
    bg: "bg-layer-2",
    ink: "text-danger-primary",
    bar: "bg-danger-primary",
    ring: "border-danger-subtle",
  },
  data: {
    icon: TableFilled,
    bg: "bg-layer-2",
    ink: "text-info-primary",
    bar: "bg-info-primary",
    ring: "border-info-subtle",
  },
  blocker: {
    icon: BlockingFilled,
    bg: "bg-layer-2",
    ink: "text-warning-primary",
    bar: "bg-warning-primary",
    ring: "border-warning-subtle",
  },
  improvement: {
    icon: StarFilled,
    bg: "bg-layer-2",
    ink: "text-success-primary",
    bar: "bg-success-primary",
    ring: "border-success-subtle",
  },
  other: {
    icon: InfoFilled,
    bg: "bg-layer-2",
    ink: "text-secondary",
    bar: "bg-layer-3",
    ring: "border-subtle",
  },
};

/** 状态在业务流上的推进顺序，用于详情页流转指示。 */
export const STATUS_FLOW: ProblemStatus[] = ["open", "progress", "verify", "closed"];

export const VIEW_ICONS: Record<string, IconComponent> = {
  open: CircleDashedFilled,
  important: AlertOctagonFilled,
  closed: CheckDoneFilled,
  all: LayerStackFilled,
  trash: ArchiveFilled,
};

export const PROBLEM_STATUSES = Object.keys(problemStatus) as ProblemStatus[];
export const PROBLEM_SEVERITIES = Object.keys(problemSeverity) as ProblemSeverity[];
export const PROBLEM_PRIORITIES = Object.keys(problemPriority) as ProblemPriority[];
export const PROBLEM_KINDS = Object.keys(problemKind) as ProblemKind[];

function Badge({
  tone,
  label,
  icon: BadgeIcon,
  className,
}: {
  tone: Tone;
  label: string;
  icon?: IconComponent;
  className?: string;
}) {
  const ResolvedIcon = BadgeIcon ?? tone.icon;
  return (
    <span className={badgeClass(tone, className)}>
      <ResolvedIcon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

export function ProblemStatusBadge({ status, className }: { status: ProblemStatus; className?: string }) {
  return <Badge tone={STATUS_TONES[status]} label={problemStatus[status]} className={className} />;
}

export function ProblemSeverityBadge({ severity, className }: { severity: ProblemSeverity; className?: string }) {
  return <Badge tone={SEVERITY_TONES[severity]} label={problemSeverity[severity]} className={className} />;
}

export function ProblemKindBadge({ kind, className }: { kind: ProblemKind; className?: string }) {
  return <Badge tone={KIND_TONES[kind]} label={problemKind[kind]} className={className} />;
}

/**
 * 优先级沿用 Plane 的 PriorityIcon，图标按 `text-priority-*` 语义色着色，
 * 文字保持中性色，避免与严重程度的红黄渐变混淆。
 */
export function ProblemPriorityBadge({
  priority,
  className,
}: {
  priority: ProblemPriority;
  className?: string;
}) {
  return (
    <span className={cn(badgeBase, "bg-layer-2 text-secondary", className)}>
      <PriorityIcon priority={priority} className="h-3 w-3 shrink-0" />
      {problemPriority[priority]}
    </span>
  );
}

/** 列表行内的紧凑指标条：严重程度 + 优先级 + 状态。 */
export function ProblemMetaBadges({
  severity,
  priority,
  status,
  className,
}: {
  severity: ProblemSeverity;
  priority: ProblemPriority;
  status: ProblemStatus;
  className?: string;
}) {
  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <ProblemSeverityBadge severity={severity} />
      <ProblemPriorityBadge priority={priority} />
      <ProblemStatusBadge status={status} />
    </span>
  );
}

export function ProblemOverdueBadge({ className }: { className?: string }) {
  return (
    <span className={badgeClass(SEVERITY_TONES.critical, className)}>
      <OverdueFilled className="h-3 w-3 shrink-0" />
      已逾期
    </span>
  );
}

/** 详情页可点击的属性胶囊：外观与只读徽章一致，多一个下拉箭头表示可改。 */
function MetaPill({
  tone,
  label,
  glyph,
  menuLabel,
  disabled,
}: {
  tone: Tone;
  label: string;
  /** 覆盖默认状态色图标，例如优先级的渐变色图标。 */
  glyph?: ReactNode;
  menuLabel: string;
  disabled?: boolean;
}) {
  const ResolvedIcon = tone.icon;
  return (
    <MenuTrigger
      disabled={disabled}
      render={
        <button
          type="button"
          disabled={disabled}
          aria-label={menuLabel}
          className={cn(
            badgeClass(tone),
            "border border-transparent transition-colors",
            disabled ? "cursor-default" : "hover:border-subtle-1"
          )}
        />
      }
    >
      {glyph ?? <ResolvedIcon className="h-3 w-3 shrink-0" />}
      {label}
      {!disabled && <ChevronDownFilled className="h-2.5 w-2.5 shrink-0 opacity-60" />}
    </MenuTrigger>
  );
}

/** 状态下拉：直接在详情页切换，无需进入编辑表单。 */
export function ProblemStatusSelect({
  status,
  disabled,
  onChange,
}: {
  status: ProblemStatus;
  disabled?: boolean;
  onChange: (status: ProblemStatus) => void;
}) {
  return (
    <Menu>
      <MetaPill
        tone={STATUS_TONES[status]}
        label={problemStatus[status]}
        menuLabel={`状态：${problemStatus[status]}，点击修改`}
        disabled={disabled}
      />
      <MenuContent align="start">
        <MenuRadioGroup value={status} onValueChange={(value) => onChange(value as ProblemStatus)}>
          {PROBLEM_STATUSES.map((key) => {
            const tone = STATUS_TONES[key];
            const RowIcon = tone.icon;
            return (
              <MenuRadioItem
                key={key}
                value={key}
                label={problemStatus[key]}
                icon={<RowIcon className={cn("h-3.5 w-3.5 shrink-0", tone.ink)} />}
              />
            );
          })}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

/** 严重程度下拉。 */
export function ProblemSeveritySelect({
  severity,
  disabled,
  onChange,
}: {
  severity: ProblemSeverity;
  disabled?: boolean;
  onChange: (severity: ProblemSeverity) => void;
}) {
  return (
    <Menu>
      <MetaPill
        tone={SEVERITY_TONES[severity]}
        label={problemSeverity[severity]}
        menuLabel={`严重程度：${problemSeverity[severity]}，点击修改`}
        disabled={disabled}
      />
      <MenuContent align="start">
        <MenuRadioGroup value={severity} onValueChange={(value) => onChange(value as ProblemSeverity)}>
          {PROBLEM_SEVERITIES.map((key) => {
            const tone = SEVERITY_TONES[key];
            const RowIcon = tone.icon;
            return (
              <MenuRadioItem
                key={key}
                value={key}
                label={problemSeverity[key]}
                icon={<RowIcon className={cn("h-3.5 w-3.5 shrink-0", tone.ink)} />}
              />
            );
          })}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

/** 优先级下拉，图标复用 Plane 的 PriorityIcon。 */
export function ProblemPrioritySelect({
  priority,
  disabled,
  onChange,
}: {
  priority: ProblemPriority;
  disabled?: boolean;
  onChange: (priority: ProblemPriority) => void;
}) {
  return (
    <Menu>
      <MetaPill
        tone={KIND_TONES.other}
        glyph={<PriorityIcon priority={priority} className="h-3 w-3 shrink-0" />}
        label={problemPriority[priority]}
        menuLabel={`优先级：${problemPriority[priority]}，点击修改`}
        disabled={disabled}
      />
      <MenuContent align="start">
        <MenuRadioGroup value={priority} onValueChange={(value) => onChange(value as ProblemPriority)}>
          {PROBLEM_PRIORITIES.map((key) => (
            <MenuRadioItem
              key={key}
              value={key}
              label={problemPriority[key]}
              icon={<PriorityIcon priority={key} className="h-3.5 w-3.5 shrink-0" />}
            />
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

/** 类型下拉。 */
export function ProblemKindSelect({
  kind,
  disabled,
  onChange,
}: {
  kind: ProblemKind;
  disabled?: boolean;
  onChange: (kind: ProblemKind) => void;
}) {
  return (
    <Menu>
      <MetaPill
        tone={KIND_TONES[kind]}
        label={problemKind[kind]}
        menuLabel={`类型：${problemKind[kind]}，点击修改`}
        disabled={disabled}
      />
      <MenuContent align="start">
        <MenuRadioGroup value={kind} onValueChange={(value) => onChange(value as ProblemKind)}>
          {PROBLEM_KINDS.map((key) => {
            const tone = KIND_TONES[key];
            const RowIcon = tone.icon;
            return (
              <MenuRadioItem
                key={key}
                value={key}
                label={problemKind[key]}
                icon={<RowIcon className={cn("h-3.5 w-3.5 shrink-0", tone.ink)} />}
              />
            );
          })}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

/** 详情页的状态流转指示：已完成步骤用成功色，当前步骤用其状态色，暂缓单独标注。 */
export function ProblemStatusFlow({ status }: { status: ProblemStatus }) {
  const paused = status === "paused";
  const current = paused ? 0 : STATUS_FLOW.indexOf(status);
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={`状态流转：当前 ${problemStatus[status]}`}>
      {STATUS_FLOW.map((step, index) => {
        const tone = STATUS_TONES[step];
        const StepIcon = tone.icon;
        const done = current > index;
        const active = current === index;
        return (
          <div key={step} className="flex items-center gap-2">
            {index > 0 && <span className={cn("h-px w-4", done || active ? "bg-success-primary" : "bg-layer-3")} />}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-body-xs-medium",
                done && cn(STATUS_TONES.closed.bg, STATUS_TONES.closed.ink, "border-success-subtle"),
                active && !done && cn(tone.bg, tone.ink, "border-transparent"),
                !done && !active && "border-subtle text-placeholder"
              )}
            >
              <StepIcon className="h-3 w-3 shrink-0" />
              {problemStatus[step]}
            </span>
          </div>
        );
      })}
      {paused && (
        <span className={cn(badgeClass(STATUS_TONES.paused), "ml-1")}>
          <PauseFilled className="h-3 w-3 shrink-0" />
          暂缓中
        </span>
      )}
    </div>
  );
}

/**
 * 状态分布概览：一条分段进度条 + 可点击图例，用于把“不同状态”一眼区分开。
 * 数据来自列表接口返回的 status_counts，切换图例会按状态筛选。
 */
export function ProblemStatusOverview({
  counts,
  activeStatus,
  onSelect,
}: {
  counts: Record<string, number>;
  activeStatus: string;
  onSelect: (status: ProblemStatus) => void;
}) {
  const total = PROBLEM_STATUSES.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
  return (
    <section className="mb-5 rounded-md border border-subtle p-4" aria-label="状态分布">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-body-sm-medium text-primary">状态分布</h2>
        <span className="text-body-xs-regular text-tertiary">未删除问题共 {total} 个</span>
      </div>
      <div
        className="flex h-2 w-full overflow-hidden rounded-full bg-layer-2"
        role="img"
        aria-label="不同状态的问题占比"
      >
        {PROBLEM_STATUSES.map((status) => {
          const value = counts[status] ?? 0;
          if (!value || !total) return null;
          return (
            <span
              key={status}
              className={cn(STATUS_TONES[status].bar, "h-full")}
              style={{ width: `${(value / total) * 100}%` }}
            />
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {PROBLEM_STATUSES.map((status) => {
          const tone = STATUS_TONES[status];
          const StatusIcon = tone.icon;
          const active = activeStatus === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(status)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-body-xs-medium transition-colors",
                active ? cn(tone.bg, tone.ink, tone.ring) : "border-subtle text-secondary hover:bg-layer-1-hover"
              )}
            >
              <StatusIcon className="h-3 w-3 shrink-0" />
              {problemStatus[status]}
              <span className="tabular-nums">{counts[status] ?? 0}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
