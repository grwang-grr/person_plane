/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { ChatOutline, MailOutline } from "@makeplane/propel/icons";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { cn } from "@plane/utils";

export type TPlanFeatureData = React.ReactNode | boolean | null;

// TODO: we should change this type and use TProductSubscriptionType instead. Need changes in common constants.
export type TPlanePlans = "free" | "one" | "pro" | "business" | "enterprise";

export type TPlanDetail = {
  id: EProductSubscriptionEnum;
  name: React.ReactNode;
  monthlyPrice?: number;
  yearlyPrice?: number;
  monthlyPriceSecondaryDescription?: React.ReactNode;
  yearlyPriceSecondaryDescription?: React.ReactNode;
  buttonCTA?: React.ReactNode;
  isActive: boolean;
};

type TPlanFeatureDetails = {
  title: React.ReactNode;
  description?: React.ReactNode;
  selfHostedDescription?: React.ReactNode;
  comingSoon?: boolean;
  selfHostedOnly?: boolean;
  cloud: Record<TPlanePlans, TPlanFeatureData>;
  "self-hosted"?: Record<TPlanePlans, TPlanFeatureData>;
};

type TPlansComparisonDetails = {
  id: string;
  title: React.ReactNode;
  comingSoon?: boolean;
  cloudOnly?: boolean;
  selfHostedOnly?: boolean;
  features: TPlanFeatureDetails[];
};

type PlanePlans = {
  planDetails: Record<TPlanePlans, TPlanDetail>;
  planHighlights: Record<TPlanePlans, string[]>;
  planComparison: TPlansComparisonDetails[];
};

function ForumIcon({ className }: { className?: string }) {
  return <ChatOutline className={cn(className, "size-5 text-secondary")} />;
}

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "w-fit rounded-sm bg-accent-primary px-1.5 py-0.5 text-caption-2xs-semibold whitespace-nowrap text-on-color",
        className
      )}
    >
      即将推出
    </span>
  );
}

export const PLANS_LIST: TPlanePlans[] = ["free", "one", "pro", "business", "enterprise"];

export const PLANS_COMPARISON_LIST: TPlansComparisonDetails[] = [
  {
    id: "project-work-tracking",
    title: "项目与工作跟踪",
    features: [
      {
        title: "项目",
        description: "创建项目，组织工作项、周期和模块。",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "工作项",
        description: "创建工作项并设置跟踪属性，加入周期或模块。",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "评论",
        description: "在工作项中回复、提及成员并交流想法。",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "周期",
        description: "通过不同时长的周期跟踪工作。",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "模块",
        description: "通过模块整理可复用工作，并分别指定负责人。",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "收件箱",
        description:
          "在加入项目前查看访客的建议和反馈。",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "估算",
        description: "使用适合的点数体系估算工作量。",
        cloud: {
          free: "Basic",
          one: "Basic",
          pro: "Advanced",
          business: "Advanced",
          enterprise: "Advanced",
        },
      },
    ],
  },
  {
    id: "project-work-management",
    title: "项目与工作管理",
    features: [
      {
        title: "批量操作",
        description: "批量添加、转移工作项，或编辑其属性。",
        cloud: {
          free: false,
          one: "Limited props",
          pro: "All props",
          business: (
            <span className="flex flex-col items-end gap-1 lg:items-center">
              <ComingSoonBadge />
              工作项转移与转换
            </span>
          ),
          enterprise: (
            <span className="flex flex-col items-end gap-1 lg:items-center">
              <ComingSoonBadge />
              工作项转移与转换
            </span>
          ),
        },
      },
      {
        title: "工时跟踪与工作日志",
        description: "按工作项记录工时，查看汇总报表并按需筛选。",
        cloud: {
          free: false,
          one: "Basic",
          pro: "Historical timesheets",
          business: "Historical timesheets\nand approvals",
          enterprise: "Historical timesheets\nand approvals",
        },
      },
      {
        title: "活动周期",
        description: "查看跨项目或单个项目中正在进行的周期。",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "工作项类型",
        description: "创建自定义工作项类型和属性。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "自定义属性",
        description: "创建自定义属性并应用到工作空间或项目。",
        cloud: {
          free: false,
          one: false,
          pro: "Project-level\ncustom properties",
          business: "Workspace-level\nproperties and roll-ups",
          enterprise: "Workspace-level\nproperties and roll-ups",
        },
      },
      {
        title: "甘特图依赖关系",
        description: "在甘特图中直观调整关联工作项的时间安排。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "工作项转移",
        description: "在项目或周期之间移动工作项。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Auto-transfer Cycle Work items",
        description:
          "将已结束周期中的未完成工作项转移到下一周期或项目默认状态。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "史诗",
        description: "通过史诗组织长期工作，整合工作项、周期和模块。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "战略计划",
        description: "创建战略计划以汇总多个史诗。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "检查点",
        description:
          "为项目、史诗和战略计划设置检查点，跟踪并报告进展。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "模块概览",
        description: "查看模块详情和进度图表。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Auto-assignment In Modules",
        description: "选择模块内工作项的分配规则，包括顺序、轮询或按容量分配。",
        cloud: {
          free: false,
          one: false,
          pro: "Linear",
          business: "Round-robin and Capacity",
          enterprise: "Round-robin and Capacity",
        },
      },
      // {
      //   title: "Project Overview",
      //   description: "See just-in-time snapshots of your project with\nessential metrics.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: true,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        title: "公开、私有和保密项目",
        description:
          "公开项目所有人均可访问；私有项目需批准加入；保密项目仅对指定成员可见。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "项目状态",
        description:
          "按状态查看项目，识别需要关注的项目。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Project Updates",
      //   description:
      //     "Keep stakeholders in the loop with a dedicated\nspace for updates that everyone in the project can\nsee.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: true,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        title: "Pre-defined work item Templates",
        description:
          "按使用场景选择工作项模板，自定义类型和属性。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "团队空间周期",
        description: "同时查看多个项目中的周期。",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "项目模板",
        description: "将状态、工作流、自动化和项目设置保存为模板。",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "基线与偏差",
        description: "设置项目进展基线，跟踪实际偏差。",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "定时通知",
        description: "定时发送报告、通知和消息。",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "收件箱负责人",
        description: "为已接受的收件箱工作项设置默认负责人。",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "自定义服务时限",
        description: "为有时效要求的工作项设置服务时限。",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "收件表单",
        description: "通过外部网页表单接收工作项。",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "邮件收件",
        description: "通过邮箱直接向项目收件箱提交工作项。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "visualization",
    title: "可视化",
    features: [
      {
        title: "布局",
        description:
          "使用列表、看板、日历、甘特图或表格查看工作项。",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "视图",
        description: "将布局的排序、筛选和显示选项保存为视图。",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "共享视图",
        description: "选择成员共享视图。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "发布视图",
        description: "将视图发布到网页以供访问和反馈。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "仪表盘与小组件",
        description: "通过自定义组件和数据类型创建仪表盘。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "analytics-reports",
    title: "分析与报表",
    features: [
      {
        title: "进度图表",
        description:
          "直接在周期、模块和概览中跟踪进度。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "周期报表",
        description: "随时生成并查看周期报表。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "洞察",
        description: "回顾、即时分析与前瞻。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Time Capsule",
      //   description: "Go back in your project's timeline and see point-in-\ntime snapshots.",
      //   comingSoon: true,
      //   cloud: {
      //     free: false,
      //     one: false,
      //     pro: false,
      //     business: true,
      //     enterprise: true,
      //   },
      // },
      {
        title: "高级文档分析",
        description: "查看文档访问、分享和评论等信息。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "自定义报表",
        description: "按任意维度和指标生成项目或工作空间报表。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "navigation",
    title: "导航",
    features: [
      {
        title: "命令搜索",
        description: "通过键盘快速查找并执行各类操作。",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      // {
      //   title: "Search",
      //   description: "Search via natural-language queries, operators, or\nPQL",
      //   cloud: {
      //     free: "Basic text search",
      //     one: "Basic text search",
      //     pro: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color text-caption-2xs-semibold p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //     business: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color text-caption-2xs-semibold p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //     enterprise: (
      //       <span className="flex flex-col items-end lg:items-center gap-1">
      //         <span className="bg-[#3f76ff] text-on-color text-caption-2xs-semibold p-0.5 w-fit whitespace-nowrap rounded-xs">
      //           COMING SOON
      //         </span>
      //         Operator capsules from text or PQL
      //       </span>
      //     ),
      //   },
      // },
      {
        title: "项目查询语言",
        description:
          "在搜索中使用项目查询语言和布尔运算符。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "workspace-user-management",
    title: "工作空间与用户管理",
    features: [
      {
        title: "成员上限",
        description: "可使用项目和工作管理功能的席位数量",
        selfHostedDescription: "Number of users that our standard infra supports\nIncrease infra to get more users",
        cloud: {
          free: "12",
          one: "",
          pro: "Unlimited",
          business: "Unlimited",
          enterprise: "Unlimited",
        },
        "self-hosted": {
          free: "~50",
          one: "~50",
          pro: "~200",
          business: "~200",
          enterprise: "Unlimited",
        },
      },
      {
        title: "角色",
        description: "选择预设角色或创建自定义权限角色。",
        cloud: {
          free: "Basic",
          one: "Basic",
          pro: "Pre-defined roles",
          business: "RBAC",
          enterprise: "GAC",
        },
      },
      {
        title: "访客",
        description: "设置用户可查看全部工作项或仅查看自己的工作项。",
        cloud: {
          free: false,
          one: "5 per paid member",
          pro: "5 per paid member",
          business: "5 per paid member",
          enterprise: "5 per paid member",
        },
      },
      {
        title: "审批",
        description: "为工作空间、项目和工作项类型指定审批管理员。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "管理界面",
        description: "通过管理界面配置工作空间和项目。",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "工作空间动态日志",
        description: "查看并筛选工作空间的动态日志。",
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "API-enabled Audit Logs",
        description: "查看完整审计日志，并通过接口接入合规系统。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "automations-workflows",
    title: "自动化与工作流",
    features: [
      {
        title: "触发条件与动作",
        description: "为自动化流程设置触发条件和对应动作。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "条件判断与循环自动化",
        description: "在自动化流程中循环使用动作作为触发条件。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "自动化数量",
        description: "工作空间中的自动化流程总数",
        cloud: {
          free: false,
          one: false,
          pro: "5,000",
          business: "10,000",
          enterprise: "Unlimited",
        },
      },
    ],
  },
  {
    id: "knowledge-management",
    title: "知识管理",
    features: [
      {
        title: "文档",
        description: "构建可访问和共享的知识库。",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Real-time Collab",
        description: "与项目、团队或工作空间成员共同编辑文档。",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "工作项嵌入",
        description: "嵌入已加入项目中的工作项。",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Link-to-work items",
        description: "在工作项详情中关联文档。",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "发布",
        description:
          "发布文档供外部用户访问和评论。",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "知识库",
        description: "无需创建项目即可建立共享知识库。",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "导出",
        description: "将文档导出为便携文档或兼容文字处理软件的文档。",
        cloud: {
          free: false,
          one: false,
          pro: "One download\nat a time",
          business: "Queued downloads",
          enterprise: "Queued downloads",
        },
      },
      {
        title: "模板",
        description: "将文档用作项目、团队或工作空间模板。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "版本",
        description: "查看并恢复文档的历史版本。",
        cloud: {
          free: false,
          one: false,
          pro: "2 days",
          business: "3 months",
          enterprise: "Unlimited",
        },
      },
      {
        title: "数据库与公式",
        description:
          "在文档中添加数据库和公式，同时保留文字和图片等内容。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "嵌套文档",
        description: "使用嵌套文档分层组织内容。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: "Word-compatible + other format downloads",
          enterprise: "Word-compatible + other format downloads",
        },
      },
    ],
  },
  {
    id: "importers",
    title: "导入工具",
    features: [
      {
        title: "Jira",
        description: "从外部项目管理平台导入工作项和成员。",
        cloud: {
          free: "Without custom props",
          one: "Without custom props",
          pro: "With custom props",
          business: "With custom props",
          enterprise: "With custom props",
        },
      },
      {
        title: "GitHub",
        description: "从代码托管平台导入工作项和成员。",
        cloud: {
          free: "Without custom props",
          one: "Without custom props",
          pro: "With custom props",
          business: "With custom props",
          enterprise: "With custom props",
        },
      },
    ],
  },
  {
    id: "integrations",
    title: "集成",
    comingSoon: true,
    features: [
      {
        title: "GitHub",
        description:
          "在项目管理与代码托管平台之间双向同步工作项、状态和动态。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Slack",
        description: "在协作消息平台接收项目动态，并通过命令管理项目。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Zapier",
        description: "使用自动化平台执行条件流程。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Zendesk",
        description: "将客服工单转为项目工作项。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Freshdesk",
        description: "将客服工单转为项目工作项。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "storage",
    title: "存储",
    cloudOnly: true,
    features: [
      {
        title: "空间",
        description: "每个工作空间的总存储容量",
        cloud: {
          free: "5GB",
          one: false,
          pro: "1 TB",
          business: "5 TB",
          enterprise: "Custom",
        },
      },
      {
        title: "文件大小上限",
        description: "工作空间上传文件的大小上限",
        cloud: {
          free: "5 MB",
          one: false,
          pro: "100 MB",
          business: "200 MB",
          enterprise: "Custom",
        },
      },
    ],
  },
  {
    id: "security",
    title: "安全",
    features: [
      {
        title: "SAML",
        description: "使用官方支持的单点登录方案接入身份提供方。",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "OIDC",
        description: "使用官方支持的开放身份验证方案接入身份提供方。",
        selfHostedOnly: true,
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "域名安全",
        description:
          "设置允许登录工作空间的域名，或限制为单个域名。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "Two-factor authentication and passkeys",
        description: "通过设备双重验证和通行密钥保护工作空间。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "密码策略",
        description: "按合规要求设置自定义密码策略。",
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "LDAP",
        description: "接入目录服务以保护工作空间。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "self-hosted",
    title: "Self-hosted",
    selfHostedOnly: true,
    features: [
      {
        title: "实例管理",
        description: "通过管理员界面管理自行部署的实例。",
        cloud: {
          free: true,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "One-click Deployment",
        description: "使用一行命令将实例部署到私有云。",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "云市场应用",
        description: "在云市场获取兼容的应用。",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "云平台应用",
        description: "获取兼容应用并部署到云平台。",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "云服务器镜像",
        description: "从云市场获取兼容的服务器镜像。",
        cloud: {
          free: false,
          one: true,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
      {
        title: "私有部署",
        description: "在托管私有云中使用应用。",
        comingSoon: true,
        cloud: {
          free: false,
          one: false,
          pro: false,
          business: false,
          enterprise: true,
        },
      },
    ],
  },
  {
    id: "support",
    title: "支持",
    features: [
      {
        title: "渠道",
        description: "根据方案获取相应的支持渠道。",
        cloud: {
          free: (
            <>
              <ForumIcon className="size-4" />
            </>
          ),
          one: (
            <div className="flex items-center gap-1">
              <MailOutline className="size-4 flex-shrink-0" />
              <ForumIcon className="size-4 flex-shrink-0" />
            </div>
          ),
          pro: (
            <div className="flex items-center gap-1">
              <MailOutline className="size-4 flex-shrink-0" />
              <ForumIcon className="size-4 flex-shrink-0" />
              <ChatOutline className="size-4 flex-shrink-0" />
            </div>
          ),
          business: "Full-suite\nprofessional services",
          enterprise: "Full-suite\nprofessional services",
        },
      },
      {
        title: "SLA",
        description: (
          <>
            高级方案提供按工作项优先级划分的服务保障。 <></>.
          </>
        ),
        cloud: {
          free: false,
          one: false,
          pro: true,
          business: true,
          enterprise: true,
        },
      },
    ],
  },
];

export const PLANE_PLANS: PlanePlans = {
  planDetails: {
    free: {
      id: EProductSubscriptionEnum.FREE,
      name: "免费",
      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
    },
    one: {
      id: EProductSubscriptionEnum.ONE,
      name: "基础版",
      monthlyPrice: 799,
      yearlyPrice: 799,
      monthlyPriceSecondaryDescription: "per workspace",
      yearlyPriceSecondaryDescription: "per workspace",
      buttonCTA: "Upgrade",
      isActive: false,
    },
    pro: {
      id: EProductSubscriptionEnum.PRO,
      name: "专业版",
      monthlyPrice: 8,
      yearlyPrice: 6,
      monthlyPriceSecondaryDescription: "billed monthly",
      yearlyPriceSecondaryDescription: "billed yearly",
      buttonCTA: "Upgrade",
      isActive: true,
    },
    business: {
      id: EProductSubscriptionEnum.BUSINESS,
      name: "商业版",
      monthlyPriceSecondaryDescription: "billed monthly",
      yearlyPriceSecondaryDescription: "billed yearly",
      buttonCTA: "Talk to Sales",
      isActive: false,
    },
    enterprise: {
      id: EProductSubscriptionEnum.ENTERPRISE,
      name: "企业版",
      monthlyPriceSecondaryDescription: "billed monthly",
      yearlyPriceSecondaryDescription: "billed yearly",
      buttonCTA: "Talk to Sales",
      isActive: false,
    },
  },
  planHighlights: {
    free: ["Upto 12 users", "Pages", "Unlimited projects", "Unlimited cycles and modules"],
    one: ["Upto 50 users", "OIDC and SAML", "Active cycles", "Limited time tracking"],
    pro: ["Unlimited users", "Custom work items + Properties", "Work item templates", "Full Time Tracking"],
    business: ["RBAC", "Project Templates", "Baselines And Deviations", "Custom Reports"],
    enterprise: ["Private + managed deployments", "GAC", "LDAP support", "Databases + Formulas"],
  },
  planComparison: PLANS_COMPARISON_LIST,
};
