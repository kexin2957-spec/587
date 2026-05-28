"use client";

import type { ReactNode } from "react";
import type { AccountParserResult } from "@/lib/tools/account-parser";
import { useAuth } from "@/components/auth/auth-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RecentContent = {
  body: string;
  comments: string;
  follows: string;
  format: string;
  likes: string;
  saves: string;
  title: string;
  url: string;
  views: string;
};

type ContentCase = {
  body: string;
  comments: string;
  follows: string;
  likes: string;
  reason: string;
  saves: string;
  title: string;
  url: string;
  views: string;
};

type Competitor = {
  field: string;
  intro: string;
  name: string;
  strength: string;
  viralTitle: string;
};

type DiagnosisForm = {
  account: {
    accountId: string;
    avgViews: string;
    biggestProblem: string;
    field: string;
    followers: string;
    intro: string;
    name: string;
    platform: string;
    primaryGoal: string;
    productService: string;
    targetCustomer: string;
  };
  bestContent: string;
  bestContentCase: ContentCase;
  competitors: Competitor[];
  monetization: {
    businessResult: string;
    contentFrequency: string;
    hasProduct: string;
    priceRange: string;
    privateTraffic: string;
    team: string;
  };
  recognition: {
    accountUrl: string;
    notes: string[];
    rawText: string;
    recognizedAt: string;
    screenshotName: string;
  };
  recentContents: RecentContent[];
  worstContent: string;
  worstContentCase: ContentCase;
};

type DiagnosisReport = {
  oneLineJudgement?: string;
  problemTags?: string[];
  scores?: Record<string, number>;
  sections?: Record<string, unknown>;
  title?: string;
};

type DiagnosisReportInput = {
  accountId?: string;
  accountName: string;
  bio?: string;
  followers?: string;
  goal?: string;
  platform: string;
  productOrService?: string;
  profileUrl?: string;
  recentContentText?: string;
  targetAudience?: string;
};

type StoredState = {
  form: DiagnosisForm;
  plan: PlanId;
  report: DiagnosisReport | null;
};

type GenerationQuota = {
  date: string;
  generationCount: number;
};

type GenerationQuotaResponse = GenerationQuota & {
  limit: number;
  remaining: number;
};

class DiagnosisReportRequestError extends Error {
  quota?: GenerationQuotaResponse;

  constructor(message: string, quota?: GenerationQuotaResponse) {
    super(message);
    this.name = "DiagnosisReportRequestError";
    this.quota = quota;
  }
}

type ParseAccountResponse = {
  crawledUrl?: string;
  error?: string;
  ok?: boolean;
  parser?: AccountParserResult;
  usedAi?: boolean;
  usedCrawler?: boolean;
};

type PlanId = "basic" | "standard" | "advanced";
type StepId = 1 | 2 | 3;

const storageKey = "media-account-diagnosis-agent:marketplace:v1";
const anonymousDeviceIdStorageKey = "media-account-diagnosis-agent:anonymous-device-id";
const generationQuotaLimit = 5;
const generationQuotaKeyPrefix = "media-account-diagnosis-agent:generation-quota";
const generationQuotaExceededMessage = "你今天的 5 次生成次数已用完，请明天再试。";
const loginRequiredMessage = "请先登录后再使用账号诊断 Agent。";
const reportApiNotConfiguredMessage = "生成接口未配置，请联系管理员配置 Render API 地址。";
const reportApiBaseUrl = normalizeReportApiBaseUrl(process.env.NEXT_PUBLIC_REPORT_API_BASE_URL);
const platformOptions = ["", "小红书", "抖音", "视频号", "B站", "快手", "公众号", "微博", "其他"];
const fieldOptions = ["", "AI", "教育", "美妆", "母婴", "装修", "本地生活", "职场", "电商", "个人IP", "其他"];

const scoreLabels: Record<string, string> = {
  positioningClarity: "账号定位清晰度",
  targetUserClarity: "目标用户明确度",
  contentVerticality: "内容垂直度",
  titleAppeal: "标题吸引力",
  profileConversion: "主页转化能力",
  contentConsistency: "内容稳定性",
  monetizationPotential: "商业变现潜力",
  privateTrafficAbility: "私域引流能力",
  overall: "综合评分",
};

const moduleLabels: Record<string, string> = {
  positioning: "账号定位诊断",
  userPersona: "目标用户画像",
  contentStructure: "内容结构分析",
  titleCover: "标题与封面建议",
  dataDiagnosis: "数据表现诊断",
  profileConversion: "主页转化诊断",
  competitorAnalysis: "竞品对标分析",
  viralOpportunities: "爆款机会识别",
  monetizationPath: "变现路径设计",
  sevenDayPlan: "7天快速优化计划",
  thirtyDayPlan: "30天内容增长计划",
  privateTrafficScripts: "私域转化话术",
  actionChecklist: "优先级行动清单",
};

const moduleOrder = Object.keys(moduleLabels);
const planModules: Record<PlanId, string[]> = {
  basic: ["positioning", "profileConversion", "sevenDayPlan", "actionChecklist"],
  standard: [
    "positioning",
    "userPersona",
    "contentStructure",
    "titleCover",
    "dataDiagnosis",
    "profileConversion",
    "sevenDayPlan",
    "privateTrafficScripts",
    "actionChecklist",
  ],
  advanced: moduleOrder,
};

const reportPlans: Array<{
  id: PlanId;
  name: string;
  description: string;
}> = [
  {
    id: "basic",
    name: "基础版",
    description: "账号评分、定位诊断、主页优化、7天计划",
  },
  {
    id: "standard",
    name: "标准版",
    description: "基础版 + 内容结构分析、标题优化、私域话术",
  },
  {
    id: "advanced",
    name: "高级版",
    description: "标准版 + 竞品分析、30天计划、变现路径",
  },
];

const featureTags = ["账号定位诊断", "内容结构分析", "主页转化优化", "7天/30天计划"];
const deliverables = [
  "账号综合评分",
  "核心问题标签",
  "主页优化建议",
  "爆款内容方向",
  "7天/30天计划",
  "私域转化话术",
];

const inputTypeLabels: Record<AccountParserResult["inputType"], string> = {
  mixed: "链接 + 文本",
  text: "账号主页复制文本",
  unknown: "未识别",
  url: "URL 链接",
};

const linkTypeLabels: Record<AccountParserResult["linkType"], string> = {
  content: "单条内容",
  profile: "账号主页",
  short: "短链接",
  unknown: "未识别",
  webpage: "普通网页",
};

function createRecentContent(): RecentContent {
  return {
    body: "",
    comments: "",
    follows: "",
    format: "图文",
    likes: "",
    saves: "",
    title: "",
    url: "",
    views: "",
  };
}

function createContentCase(): ContentCase {
  return {
    body: "",
    comments: "",
    follows: "",
    likes: "",
    reason: "",
    saves: "",
    title: "",
    url: "",
    views: "",
  };
}

function createCompetitor(): Competitor {
  return {
    field: "",
    intro: "",
    name: "",
    strength: "",
    viralTitle: "",
  };
}

function createDefaultForm(): DiagnosisForm {
  return {
    account: {
      accountId: "",
      avgViews: "",
      biggestProblem: "",
      field: "",
      followers: "",
      intro: "",
      name: "",
      platform: "",
      primaryGoal: "",
      productService: "",
      targetCustomer: "",
    },
    bestContent: "",
    bestContentCase: createContentCase(),
    competitors: [createCompetitor()],
    monetization: {
      businessResult: "",
      contentFrequency: "每周3-5次",
      hasProduct: "有",
      priceRange: "",
      privateTraffic: "没有",
      team: "个人",
    },
    recognition: {
      accountUrl: "",
      notes: [],
      rawText: "",
      recognizedAt: "",
      screenshotName: "",
    },
    recentContents: [createRecentContent()],
    worstContent: "",
    worstContentCase: createContentCase(),
  };
}

function createSampleForm(): DiagnosisForm {
  return {
    account: {
      accountId: "demo-ai-growth",
      avgViews: "3200",
      biggestProblem: "播放量忽高忽低，收藏不少但私信咨询少，主页不知道怎么承接训练营。",
      field: "AI",
      followers: "8600",
      intro: "分享 AI 工具、办公自动化和副业提效方法，帮普通人少加班、多赚钱。",
      name: "小林AI提效",
      platform: "小红书",
      primaryGoal: "获客",
      productService: "99 元提示词模板包、699 元 AI 办公训练营、企业 AI 提效内训。",
      targetCustomer: "想用 AI 提升工作效率的职场新人、自由职业者和小微企业主。",
    },
    bestContent: "这 5 个 AI 工具让我每天少加班 2 小时，播放 12800，收藏 910。标题有结果感，内容适合收藏。",
    bestContentCase: {
      body: "真实办公场景拆解 5 个 AI 工具，每个工具给一个可直接照做的用法。",
      comments: "96",
      follows: "186",
      likes: "680",
      reason: "标题有明确结果，内容可收藏，结尾引导领取模板。",
      saves: "910",
      title: "这 5 个 AI 工具让我每天少加班 2 小时",
      url: "",
      views: "12800",
    },
    competitors: [
      {
        field: "AI办公",
        intro: "每天拆一个真实办公场景，用 AI 模板解决具体问题。",
        name: "效率研究所",
        strength: "场景具体，标题有强结果，结尾引导领取模板。",
        viralTitle: "我用 AI 做完了老板要的 30 页汇报",
      },
    ],
    monetization: {
      businessResult: "每月新增 150 个精准私域线索，成交 20 份模板包和 10 个训练营名额。",
      contentFrequency: "每周3-5次",
      hasProduct: "有",
      priceRange: "99-699 元，企业内训 8000 元起",
      privateTraffic: "企微",
      team: "个人",
    },
    recognition: {
      accountUrl: "https://www.xiaohongshu.com/user/profile/demo-ai-growth",
      notes: ["示例数据已填入"],
      rawText:
        "账号名称：小林AI提效\n简介：分享 AI 工具、办公自动化和副业提效方法，帮普通人少加班、多赚钱。\n粉丝数：8600\n平均播放量：3200\n目标：获客\n内容：这 5 个 AI 工具让我每天少加班 2 小时，播放12800，点赞680，收藏910，评论96\n内容：别再问 ChatGPT 写文案了，先这样提问，播放4200，点赞180，收藏260",
      recognizedAt: new Date().toISOString(),
      screenshotName: "",
    },
    recentContents: [
      {
        ...createRecentContent(),
        body: "真实办公场景拆解 AI 工具。",
        comments: "96",
        follows: "186",
        likes: "680",
        saves: "910",
        title: "这 5 个 AI 工具让我每天少加班 2 小时",
        views: "12800",
      },
      {
        ...createRecentContent(),
        body: "讲 3 个提问模板。",
        comments: "28",
        follows: "46",
        format: "口播",
        likes: "180",
        saves: "260",
        title: "别再问 ChatGPT 写文案了，先这样提问",
        views: "4200",
      },
    ],
    worstContent: "AI 副业到底还能不能做，播放 1900。选题太大，缺少案例和步骤。",
    worstContentCase: {
      body: "泛泛讨论 AI 副业机会，缺少具体案例和行动步骤。",
      comments: "12",
      follows: "9",
      likes: "42",
      reason: "选题太大，目标用户不明确，标题没有承诺具体结果。",
      saves: "31",
      title: "AI 副业到底还能不能做",
      url: "",
      views: "1900",
    },
  };
}

function mergeStoredForm(value: unknown): DiagnosisForm {
  if (!value || typeof value !== "object") return createDefaultForm();

  const base = createDefaultForm();
  const stored = value as Partial<DiagnosisForm>;
  return {
    ...base,
    ...stored,
    account: { ...base.account, ...(stored.account ?? {}) },
    bestContentCase: { ...base.bestContentCase, ...(stored.bestContentCase ?? {}) },
    competitors: stored.competitors?.length ? stored.competitors : base.competitors,
    monetization: { ...base.monetization, ...(stored.monetization ?? {}) },
    recognition: { ...base.recognition, ...(stored.recognition ?? {}) },
    recentContents: stored.recentContents?.length ? stored.recentContents : base.recentContents,
    worstContentCase: { ...base.worstContentCase, ...(stored.worstContentCase ?? {}) },
  };
}

function readStoredState(): StoredState {
  const fallback: StoredState = {
    form: createDefaultForm(),
    plan: "advanced",
    report: null,
  };

  if (typeof window === "undefined") return fallback;

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null") as Partial<StoredState> | null;
    if (!stored) return fallback;

    return {
      form: mergeStoredForm(stored.form),
      plan: isPlanId(stored.plan) ? stored.plan : fallback.plan,
      report: stored.report || null,
    };
  } catch {
    localStorage.removeItem(storageKey);
    return fallback;
  }
}

function isPlanId(value: unknown): value is PlanId {
  return value === "basic" || value === "standard" || value === "advanced";
}

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAnonymousDeviceId() {
  if (typeof window === "undefined") return "";

  const existing = localStorage.getItem(anonymousDeviceIdStorageKey);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  localStorage.setItem(anonymousDeviceIdStorageKey, generated);
  return generated;
}

function getGenerationQuotaStorageKey(quotaIdentity: string | null) {
  return `${generationQuotaKeyPrefix}:${quotaIdentity || "anonymous"}`;
}

function createGenerationQuota(): GenerationQuota {
  return {
    date: getLocalDateKey(),
    generationCount: 0,
  };
}

function normalizeGenerationQuota(value: unknown): GenerationQuota {
  const today = getLocalDateKey();

  if (!value || typeof value !== "object") {
    return createGenerationQuota();
  }

  const quota = value as Partial<GenerationQuota>;

  if (quota.date !== today) {
    return createGenerationQuota();
  }

  return {
    date: today,
    generationCount: Math.max(0, Math.min(generationQuotaLimit, Number(quota.generationCount) || 0)),
  };
}

function readGenerationQuota(quotaIdentity: string | null): GenerationQuota {
  if (typeof window === "undefined") return createGenerationQuota();

  try {
    const storageKeyForUser = getGenerationQuotaStorageKey(quotaIdentity);
    return normalizeGenerationQuota(JSON.parse(localStorage.getItem(storageKeyForUser) || "null"));
  } catch {
    return createGenerationQuota();
  }
}

function writeGenerationQuota(quotaIdentity: string | null, quota: GenerationQuota) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getGenerationQuotaStorageKey(quotaIdentity), JSON.stringify(quota));
}

function inferField(input: string) {
  const rules: Array<[string, RegExp]> = [
    ["AI", /AI|ChatGPT|智能体|提示词|自动化|提效|办公/i],
    ["教育", /教育|课程|学习|训练营|考试|升学|考研/],
    ["美妆", /美妆|护肤|彩妆|口红|变美/],
    ["母婴", /母婴|育儿|宝宝|亲子|早教/],
    ["装修", /装修|家装|设计|收纳|软装/],
    ["本地生活", /探店|同城|本地|门店|餐饮|到店/],
    ["职场", /职场|简历|面试|副业|成长|效率/],
    ["电商", /电商|带货|直播间|选品|店铺|私域团购/],
    ["个人IP", /个人IP|知识博主|创业|自媒体|新媒体/],
  ];
  return rules.find(([, pattern]) => pattern.test(input))?.[0] ?? "";
}

function parseCount(value: string) {
  const match = value.match(/([\d.]+)\s*(万|w|W|k|K|千)?/);
  if (!match) return null;

  const number = Number(match[1]);
  if (!Number.isFinite(number)) return null;

  const unit = match[2];
  if (unit === "万" || unit === "w" || unit === "W") return Math.round(number * 10000);
  if (unit === "千" || unit === "k" || unit === "K") return Math.round(number * 1000);
  return Math.round(number);
}

function formatCount(value: number) {
  if (value >= 10000) {
    const short = value / 10000;
    return `${Number.isInteger(short) ? short.toFixed(0) : short.toFixed(1)}万`;
  }
  return String(value);
}

function averageViews(contents: RecentContent[]) {
  const values = contents
    .map((item) => parseCount(item.views))
    .filter((value): value is number => typeof value === "number" && value > 0);
  if (!values.length) return "";
  return formatCount(Math.round(values.reduce((sum, value) => sum + value, 0) / values.length));
}

function hasRecentContent(item: RecentContent) {
  return Boolean(item.title.trim() || item.body.trim() || item.views.trim());
}

function recentContentsToText(contents: RecentContent[]) {
  return contents
    .filter(hasRecentContent)
    .map((item, index) =>
      [
        `内容${index + 1}：${item.title || "未命名内容"}`,
        item.views ? `播放/阅读：${item.views}` : "",
        item.likes ? `点赞：${item.likes}` : "",
        item.saves ? `收藏：${item.saves}` : "",
        item.comments ? `评论：${item.comments}` : "",
        item.follows ? `涨粉：${item.follows}` : "",
        item.body ? `正文/脚本：${item.body}` : "",
      ]
        .filter(Boolean)
        .join("，"),
    )
    .join("\n");
}

function createReportInput(form: DiagnosisForm): DiagnosisReportInput {
  const recentContentText = [form.recognition.rawText, recentContentsToText(form.recentContents)]
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n\n");
  const inferredAccountId = form.account.accountId.trim() || extractAccountIdFromText(form.account.name);
  const accountName = normalizeAccountNameValue(form.account.name, inferredAccountId);

  return {
    accountId: inferredAccountId || undefined,
    accountName: accountName || inferredAccountId,
    bio: form.account.intro.trim() || undefined,
    followers: form.account.followers.trim() || undefined,
    goal:
      form.account.biggestProblem.trim() ||
      form.account.primaryGoal.trim() ||
      form.monetization.businessResult.trim() ||
      undefined,
    platform: form.account.platform.trim(),
    productOrService: form.account.productService.trim() || undefined,
    profileUrl: form.recognition.accountUrl.trim() || undefined,
    recentContentText: recentContentText || undefined,
    targetAudience: form.account.targetCustomer.trim() || form.account.primaryGoal.trim() || undefined,
  };
}

function compactText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => compactText(item)).filter(Boolean).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key}: ${compactText(item)}`)
      .join("\n");
  }
  return String(value ?? "").trim();
}

function reportToMarkdown(report: DiagnosisReport, moduleIds: string[]) {
  const scoreRows = Object.entries(scoreLabels)
    .map(([key, label]) => `| ${label} | ${report.scores?.[key] ?? ""} |`)
    .join("\n");
  const modules = moduleIds
    .map((id) => `## ${moduleLabels[id]}\n${compactText(report.sections?.[id])}`)
    .join("\n\n");

  return `# ${report.title ?? "《新媒体账号增长诊断报告》"}\n\n${
    report.oneLineJudgement ?? ""
  }\n\n## 账号综合评分\n| 维度 | 评分 |\n| --- | --- |\n${scoreRows}\n\n## 问题标签\n${(report.problemTags ?? [])
    .map((tag) => `- ${tag}`)
    .join("\n")}\n\n${modules}`;
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.left = "-9999px";
  textarea.style.position = "fixed";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-sm font-semibold text-slate-800">{children}</span>;
}

function getAccountNamePlaceholder(platform: string) {
  const placeholders: Record<string, string> = {
    B站: "例如：科技增长笔记",
    公众号: "例如：公众号名称：增长研究所",
    小红书: "例如：一只做内容的小张",
    微博: "例如：品牌主理人小林",
    快手: "例如：同城生活小周",
    抖音: "例如：AI效率研究所",
    视频号: "例如：视频号名称：xxxx",
  };

  return placeholders[platform] ?? "例如：平台账号名、昵称";
}

function getAccountIdPlaceholder(platform: string) {
  const placeholders: Record<string, string> = {
    B站: "例如：B站 UID：123456",
    公众号: "例如：公众号原始ID gh_xxxx，可不填",
    小红书: "例如：小红书号：red_2026",
    微博: "例如：微博 UID 或主页 ID",
    快手: "例如：快手号：ks_xxxx",
    抖音: "例如：抖音号：douyin_2026",
    视频号: "例如：视频号 ID，可不填",
  };

  return placeholders[platform] ?? "例如：平台号、UID、账号ID";
}

function extractAccountIdFromText(value: string) {
  const text = value.trim();
  if (!text) return "";

  const labeledMatch = text.match(
    /(?:小红书号|抖音号|快手号|视频号|B站\s*UID|B站UID|UID|账号\s*ID|平台号|ID)\s*[:：]?\s*([A-Za-z0-9._-]{2,})/i,
  );
  if (labeledMatch?.[1]) return labeledMatch[1].trim();

  if (/^[A-Za-z0-9._-]{5,}$/.test(text) && /[\d._-]/.test(text)) return text;
  return "";
}

function normalizeAccountNameValue(value: string, accountId = "") {
  const text = value.trim();
  if (!text) return "";

  const withoutLabel = text
    .replace(/^(?:小红书号|抖音号|快手号|视频号|B站\s*UID|B站UID|UID|账号\s*ID|平台号|ID)\s*[:：]?\s*/i, "")
    .trim();

  if (accountId && withoutLabel === accountId) return "";
  return withoutLabel || text;
}

function normalizeReportApiBaseUrl(value: string | undefined) {
  return (value || "").trim().replace(/\/+$/, "");
}

function getGenerateReportEndpoint(queryString = "") {
  const endpoint = reportApiBaseUrl
    ? reportApiBaseUrl.endsWith("/api/generate-report")
      ? reportApiBaseUrl
      : `${reportApiBaseUrl}/api/generate-report`
    : "/api/generate-report";

  return queryString ? `${endpoint}?${queryString}` : endpoint;
}

async function getReportRequestHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const supabase = createSupabaseBrowserClient();

  if (!supabase) {
    return headers;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

async function requestDiagnosisReport({
  anonymousDeviceId,
  consumeQuota,
  focus,
  form,
  plan,
}: {
  anonymousDeviceId: string;
  consumeQuota: boolean;
  focus: string;
  form: DiagnosisForm;
  plan: PlanId;
}) {
  if (!reportApiBaseUrl) {
    throw new DiagnosisReportRequestError(reportApiNotConfiguredMessage);
  }

  const headers = await getReportRequestHeaders();
  const diagnosisInput = createReportInput(form);
  const response = await fetch(getGenerateReportEndpoint(), {
    body: JSON.stringify({
      ...diagnosisInput,
      anonymousDeviceId,
      consumeQuota,
      diagnosisInput,
      focus,
      form,
      plan,
    }),
    headers,
    method: "POST",
  });
  const payload = (await response.json()) as {
    error?: string;
    ok?: boolean;
    quota?: GenerationQuotaResponse;
    report?: DiagnosisReport;
  };

  if (!response.ok || !payload.ok || !payload.report) {
    throw new DiagnosisReportRequestError(
      payload.error || "生成失败，请稍后重试。已保留你填写的内容。",
      payload.quota,
    );
  }

  return {
    quota: payload.quota,
    report: payload.report,
  };
}

async function requestGenerationQuota(anonymousDeviceId: string) {
  if (!reportApiBaseUrl) {
    return null;
  }

  const params = new URLSearchParams({ anonymousDeviceId });

  try {
    const headers = await getReportRequestHeaders();
    const response = await fetch(getGenerateReportEndpoint(params.toString()), { headers });
    const payload = (await response.json()) as {
      ok?: boolean;
      quota?: GenerationQuotaResponse;
    };

    if (!response.ok || !payload.ok || !payload.quota) {
      return null;
    }

    return payload.quota;
  } catch {
    return null;
  }
}

type AccountParsePayload = {
  accountId?: string;
  accountName?: string;
  accountUrl?: string;
  platform?: string;
  rawText?: string;
};

async function requestAccountParsePayload(payload: AccountParsePayload) {
  const response = await fetch("/api/tools/media-account-diagnosis/parse-account", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const result = (await response.json()) as ParseAccountResponse;

  if (!response.ok || !result.ok || !result.parser) {
    throw new Error(result.error || "暂时无法识别该链接，请手动选择平台。");
  }

  return result.parser;
}

async function requestAccountParse(form: DiagnosisForm) {
  const inferredAccountId = form.account.accountId || extractAccountIdFromText(form.account.name);
  return requestAccountParsePayload({
    accountId: inferredAccountId,
    accountName: normalizeAccountNameValue(form.account.name, inferredAccountId),
    accountUrl: form.recognition.accountUrl,
    platform: form.account.platform,
    rawText: form.recognition.rawText,
  });
}

function mergeParsedAccountIntoForm(current: DiagnosisForm, parsed: AccountParserResult) {
  const recognizedContents = parsed.recentPosts.map((post) => ({
    ...createRecentContent(),
    body: post.title,
    comments: post.comments ?? "",
    likes: post.likes ?? "",
    saves: post.saves ?? "",
    title: post.title,
    views: post.views ?? "",
  }));
  const nextRecentContents = recognizedContents.length ? recognizedContents : current.recentContents;
  const field = parsed.inferredField || inferField([current.account.intro, current.recognition.rawText].join("\n"));
  const notes = Array.from(
    new Set(
      [
        parsed.platform !== "unknown" ? `已识别平台：${parsed.platformLabel}` : "",
        parsed.accountId ? `账号ID：${parsed.accountId}` : "",
        parsed.pageTitle ? `公开页面标题：${parsed.pageTitle}` : "",
        parsed.pageDescription ? `公开页面简介：${parsed.pageDescription}` : "",
        parsed.isShortLink ? "短链接：只能判断平台，无法展开读取账号详情。" : "",
        parsed.normalizedUrl ? `标准化链接：${parsed.normalizedUrl}` : "",
        field ? `已推断领域：${field}` : "",
        parsed.contentStyle ? `内容风格：${parsed.contentStyle}` : "",
        parsed.targetUsers.length ? `可能目标用户：${parsed.targetUsers.join("、")}` : "",
        recognizedContents.length ? `已识别近期内容：${recognizedContents.length} 条` : "",
        ...parsed.warnings,
      ].filter(Boolean),
    ),
  );

  return {
    ...current,
    account: {
      ...current.account,
      accountId: parsed.accountId || current.account.accountId,
      avgViews: parsed.avgViews || averageViews(nextRecentContents) || current.account.avgViews,
      field: field || current.account.field,
      followers: parsed.followers || current.account.followers,
      intro: parsed.bio || current.account.intro,
      name: current.account.name || parsed.accountName,
      platform: current.account.platform || (parsed.platform !== "unknown" ? parsed.platformLabel : ""),
      targetCustomer: current.account.targetCustomer || parsed.targetUsers.join("、") || current.account.targetCustomer,
    },
    recognition: {
      ...current.recognition,
      accountUrl: parsed.normalizedUrl || current.recognition.accountUrl,
      notes,
      recognizedAt: new Date().toISOString(),
    },
    recentContents: nextRecentContents,
  };
}

function shouldAutoEnrichBeforeGeneration(targetForm: DiagnosisForm) {
  const inferredAccountId = targetForm.account.accountId || extractAccountIdFromText(targetForm.account.name);
  const hasInputToCrawl = Boolean(
    targetForm.recognition.accountUrl.trim() ||
      inferredAccountId ||
      (targetForm.account.platform.trim() && targetForm.account.name.trim()),
  );
  const hasEnoughAccountData = Boolean(
    targetForm.account.intro.trim() &&
      (targetForm.recognition.rawText.trim() || targetForm.recentContents.some(hasRecentContent)),
  );

  return hasInputToCrawl && !hasEnoughAccountData;
}

export function MediaAccountDiagnosisAgent() {
  const { isLoading: isAuthLoading, user } = useAuth();
  const quotaUserId = user?.id ?? null;
  const [anonymousDeviceId] = useState(() => getAnonymousDeviceId());
  const quotaIdentity = quotaUserId ? `user:${quotaUserId}` : `device:${anonymousDeviceId || "anonymous"}`;
  const [form, setForm] = useState<DiagnosisForm>(() => createDefaultForm());
  const [plan, setPlan] = useState<PlanId>("advanced");
  const [report, setReport] = useState<DiagnosisReport | null>(null);
  const [activeStep, setActiveStep] = useState<StepId>(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [generationQuotaRevision, setGenerationQuotaRevision] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [isStorageReady, setIsStorageReady] = useState(false);
  const hasHydratedFromStorage = useRef(false);
  const visibleModules = useMemo(() => planModules[plan] ?? planModules.advanced, [plan]);
  const generationQuota = useMemo(
    () => {
      void generationQuotaRevision;
      return isStorageReady ? readGenerationQuota(quotaIdentity) : createGenerationQuota();
    },
    [isStorageReady, quotaIdentity, generationQuotaRevision],
  );
  const remainingGenerations = Math.max(0, generationQuotaLimit - generationQuota.generationCount);
  const syncGenerationQuota = useCallback(
    (quota: GenerationQuotaResponse) => {
      const nextQuota = {
        date: quota.date,
        generationCount: Math.max(0, Math.min(generationQuotaLimit, quota.generationCount)),
      };

      writeGenerationQuota(quotaIdentity, nextQuota);
      setGenerationQuotaRevision((current) => current + 1);
    },
    [quotaIdentity],
  );
  const incrementLocalGenerationQuota = useCallback(() => {
    const currentQuota = readGenerationQuota(quotaIdentity);
    const nextQuota = {
      date: getLocalDateKey(),
      generationCount: Math.min(generationQuotaLimit, currentQuota.generationCount + 1),
    };

    writeGenerationQuota(quotaIdentity, nextQuota);
    setGenerationQuotaRevision((current) => current + 1);
  }, [quotaIdentity]);

  useEffect(() => {
    if (!isStorageReady) return;
    localStorage.setItem(storageKey, JSON.stringify({ form, plan, report }));
  }, [form, isStorageReady, plan, report]);

  useEffect(() => {
    if (!isStorageReady || !user) return;
    void requestGenerationQuota(anonymousDeviceId || getAnonymousDeviceId()).then((quota) => {
      if (quota) syncGenerationQuota(quota);
    });
  }, [anonymousDeviceId, isStorageReady, quotaIdentity, syncGenerationQuota, user]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (hasHydratedFromStorage.current || typeof window === "undefined") return;
    hasHydratedFromStorage.current = true;
    window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("sample") !== "1" || !user) {
        const stored = readStoredState();
        setForm(stored.form);
        setPlan(stored.plan);
        setReport(stored.report);
        setActiveStep(stored.report ? 3 : 1);
        setIsStorageReady(true);
        return;
      }

      const sample = createSampleForm();
      setForm(sample);
      setPlan("advanced");
      setActiveStep(3);
      setError("");
      setIsGenerating(true);
      void requestDiagnosisReport({
        anonymousDeviceId: getAnonymousDeviceId(),
        consumeQuota: false,
        focus: "full",
        form: sample,
        plan: "advanced",
      })
        .then(({ quota, report: nextReport }) => {
          if (quota) syncGenerationQuota(quota);
          setReport(nextReport);
          setToast("示例报告已生成");
        })
        .catch((requestError) => {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "生成失败，请稍后重试。已保留你填写的内容。",
          );
        })
        .finally(() => {
          setIsGenerating(false);
          setIsStorageReady(true);
        });
    }, 0);
  }, [syncGenerationQuota, user]);

  function updateAccount(key: keyof DiagnosisForm["account"], value: string) {
    setForm((current) => ({
      ...current,
      account: { ...current.account, [key]: value },
    }));
  }

  function updateRecognition(key: keyof DiagnosisForm["recognition"], value: string | string[]) {
    setForm((current) => ({
      ...current,
      recognition: { ...current.recognition, [key]: value },
    }));
  }

  function updateMonetization(key: keyof DiagnosisForm["monetization"], value: string) {
    setForm((current) => ({
      ...current,
      monetization: { ...current.monetization, [key]: value },
    }));
  }

  function updateContent(index: number, key: keyof RecentContent, value: string) {
    setForm((current) => ({
      ...current,
      recentContents: current.recentContents.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function updateCompetitor(index: number, key: keyof Competitor, value: string) {
    setForm((current) => ({
      ...current,
      competitors: current.competitors.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function updateContentCase(kind: "best" | "worst", key: keyof ContentCase, value: string) {
    const targetKey = kind === "best" ? "bestContentCase" : "worstContentCase";
    setForm((current) => ({
      ...current,
      [targetKey]: { ...current[targetKey], [key]: value },
    }));
  }

  async function recognizeContentCase(kind: "best" | "worst") {
    const item = kind === "best" ? form.bestContentCase : form.worstContentCase;
    const rawText = [item.title, item.body, item.reason].filter(Boolean).join("\n");

    if (!item.url && !rawText) {
      setToast("先填写内容链接、标题或正文，再尝试识别。");
      return;
    }

    try {
      const parsed = await requestAccountParsePayload({ accountUrl: item.url, rawText });
      const post = parsed.recentPosts[0];
      const next = {
        title: post?.title || item.title || parsed.pageTitle,
        views: post?.views || item.views,
        likes: post?.likes || item.likes,
        saves: post?.saves || item.saves,
        comments: post?.comments || item.comments,
        follows: post?.follows || item.follows,
      };
      const targetKey = kind === "best" ? "bestContentCase" : "worstContentCase";

      setForm((current) => ({
        ...current,
        [targetKey]: {
          ...current[targetKey],
          ...next,
        },
      }));
      setToast("内容标题和数据已尽量识别，缺失项可手动补充。");
    } catch {
      setToast("暂时无法识别该内容，请手动补充标题和数据。");
    }
  }

  async function recognizeAccountWithParser() {
    const inferredAccountId = form.account.accountId || extractAccountIdFromText(form.account.name);
    const raw = [
      form.account.platform ? `平台：${form.account.platform}` : "",
      form.account.name ? `账号名称：${form.account.name}` : "",
      inferredAccountId ? `平台账号ID：${inferredAccountId}` : "",
      form.account.intro ? `简介：${form.account.intro}` : "",
      form.account.followers ? `粉丝数：${form.account.followers}` : "",
      form.account.avgViews ? `平均播放/阅读：${form.account.avgViews}` : "",
      form.recognition.accountUrl ? `账号主页链接：${form.recognition.accountUrl}` : "",
      form.recognition.rawText,
      recentContentsToText(form.recentContents),
    ]
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!raw && !form.recognition.screenshotName) {
      setToast("先选择平台并填写账号名称或账号ID。");
      return;
    }

    if (!raw && form.recognition.screenshotName) {
      const notes = [
        `已记录截图：${form.recognition.screenshotName}。截图识别功能后续上线，当前请优先填写账号名和主页信息。`,
        "链接和截图仅作为辅助参考，不保证每个平台都能自动读取。",
      ];

      setForm((current) => ({
        ...current,
        recognition: {
          ...current.recognition,
          notes,
          recognizedAt: new Date().toISOString(),
        },
      }));
      setToast("已记录截图，请继续填写平台和账号名。");
      return;
    }

    if (!form.recognition.accountUrl.trim() && !form.recognition.rawText.trim()) {
      const field = inferField(raw);
      const notes = [
        form.account.platform ? `平台：${form.account.platform}` : "",
        form.account.name ? `账号名称：${form.account.name}` : "",
        inferredAccountId ? `平台账号ID：${inferredAccountId}` : "",
        field ? `已推断领域：${field}` : "",
        form.recognition.screenshotName
          ? `已记录截图：${form.recognition.screenshotName}。截图识别功能后续上线，当前请优先填写账号名和主页信息。`
          : "",
        "当前已按你填写的信息整理为诊断输入，链接仅作为辅助参考。",
      ].filter(Boolean);

      setForm((current) => ({
        ...current,
        account: {
          ...current.account,
          accountId: current.account.accountId || inferredAccountId,
          field: current.account.field || field,
        },
        recognition: {
          ...current.recognition,
          notes,
          recognizedAt: new Date().toISOString(),
        },
      }));
      setToast("信息已整理，可以继续确认目标。");
      return;
    }

    setIsRecognizing(true);
    setError("");

    try {
      const parsed = await requestAccountParse(form);
      const field = inferField(raw);
      const recognizedContents = parsed.recentPosts.map((post) => ({
        ...createRecentContent(),
        body: post.title,
        comments: post.comments ?? "",
        likes: post.likes ?? "",
        title: post.title,
        views: post.views ?? "",
      }));
      const notes = Array.from(
        new Set(
          [
            parsed.platform !== "unknown" ? `已识别平台：${parsed.platformLabel}` : "暂时无法识别平台",
            parsed.accountId ? `账号ID：${parsed.accountId}` : "",
            parsed.inputType !== "unknown" ? `输入类型：${inputTypeLabels[parsed.inputType]}` : "",
            parsed.linkType !== "unknown" ? `链接类型：${parsed.linkTypeLabel || linkTypeLabels[parsed.linkType]}` : "",
            parsed.pageTitle ? `公开页面标题：${parsed.pageTitle}` : "",
            parsed.isShortLink ? "短链接：只能判断平台，无法展开读取账号详情。" : "",
            parsed.normalizedUrl ? `标准化链接：${parsed.normalizedUrl}` : "",
            parsed.inferredField || field ? `已推断领域：${parsed.inferredField || field}` : "",
            parsed.contentStyle ? `内容风格：${parsed.contentStyle}` : "",
            parsed.targetUsers.length ? `可能目标用户：${parsed.targetUsers.join("、")}` : "",
            recognizedContents.length ? `已识别近期内容：${recognizedContents.length} 条` : "",
            form.recognition.screenshotName
              ? `已记录截图：${form.recognition.screenshotName}。上传截图可作为诊断参考，当前版本主要根据文本信息生成报告。`
              : "",
            ...parsed.warnings,
          ].filter(Boolean),
        ),
      );

      setForm((current) => {
        const nextRecentContents = recognizedContents.length ? recognizedContents : current.recentContents;

        return {
          ...current,
          account: {
            ...current.account,
            avgViews: parsed.avgViews || averageViews(nextRecentContents) || current.account.avgViews,
            accountId: parsed.accountId || current.account.accountId,
            field: parsed.inferredField || field || current.account.field,
            followers: parsed.followers || current.account.followers,
            intro: parsed.bio || current.account.intro,
            name: current.account.name || parsed.accountName,
            platform: current.account.platform || (parsed.platform !== "unknown" ? parsed.platformLabel : ""),
            targetCustomer:
              current.account.targetCustomer || parsed.targetUsers.join("、") || current.account.targetCustomer,
          },
          recognition: {
            ...current.recognition,
            accountUrl: parsed.normalizedUrl || current.recognition.accountUrl,
            notes,
            recognizedAt: new Date().toISOString(),
          },
          recentContents: nextRecentContents,
        };
      });

      setActiveStep(1);
      setToast(
        parsed.warnings.find((warning) => warning.includes("无法读取账号详细信息")) ||
          parsed.warnings.find((warning) => warning.includes("暂时无法识别")) ||
          "信息已整理，缺失项可继续手动补充。",
      );
    } catch {
      const warning = form.account.platform
        ? "已识别平台，但无法读取账号详细信息，请补充账号简介、粉丝数和近期内容。"
        : "暂时无法识别该链接，请手动选择平台。";
      setForm((current) => ({
        ...current,
        recognition: {
          ...current.recognition,
          notes: Array.from(new Set([...current.recognition.notes, warning])),
          recognizedAt: new Date().toISOString(),
        },
      }));
      setToast(warning);
    } finally {
      setIsRecognizing(false);
    }
  }

  function fillSample() {
    setForm(createSampleForm());
    setReport(null);
    setActiveStep(1);
    setToast("示例数据已填入");
  }

  function validate(targetForm: DiagnosisForm) {
    if (!targetForm.account.platform.trim()) return "请选择平台。";
    if (!targetForm.account.name.trim() && !targetForm.account.accountId.trim()) {
      return "请填写账号名称或账号ID。";
    }
    if (!targetForm.account.biggestProblem.trim() && !targetForm.account.primaryGoal.trim()) {
      return "请补充当前最想解决的问题。";
    }
    if (!targetForm.account.targetCustomer.trim() && !targetForm.account.primaryGoal.trim()) {
      return "请补充目标客户或账号目标。";
    }
    return "";
  }

  function getFreshGenerationQuota() {
    const freshQuota = readGenerationQuota(quotaIdentity);
    setGenerationQuotaRevision((current) => current + 1);
    return freshQuota;
  }

  async function generateReport(
    focus = "full",
    formOverride: DiagnosisForm = form,
    planOverride: PlanId = plan,
    options: { consumeQuota?: boolean } = {},
  ) {
    const shouldConsumeQuota = options.consumeQuota ?? true;
    if (shouldConsumeQuota && !user) {
      setError(loginRequiredMessage);
      setToast(loginRequiredMessage);
      setActiveStep(3);
      return;
    }

    const validationError = validate(formOverride);
    if (validationError) {
      setError(validationError);
      setToast(validationError);
      setActiveStep(
        validationError.includes("平台") || validationError.includes("账号名称") ? 1 : 2,
      );
      return;
    }

    if (shouldConsumeQuota) {
      const freshQuota = getFreshGenerationQuota();

      if (freshQuota.generationCount >= generationQuotaLimit) {
        setError(generationQuotaExceededMessage);
        setToast(generationQuotaExceededMessage);
        setActiveStep(3);
        return;
      }
    }

    setIsGenerating(true);
    setError("");
    setActiveStep(3);
    try {
      const enrichedForm = await enrichFormForGeneration(formOverride);
      const { quota, report: nextReport } = await requestDiagnosisReport({
        anonymousDeviceId: anonymousDeviceId || getAnonymousDeviceId(),
        consumeQuota: shouldConsumeQuota,
        focus,
        form: enrichedForm,
        plan: planOverride,
      });
      setReport(nextReport);
      if (quota) {
        syncGenerationQuota(quota);
      } else if (shouldConsumeQuota) {
        incrementLocalGenerationQuota();
      }
      setToast("诊断报告已生成");
      window.setTimeout(() => {
        document.getElementById("report-workbench")?.scrollIntoView({ behavior: "smooth" });
      }, 60);
    } catch (requestError) {
      if (requestError instanceof DiagnosisReportRequestError && requestError.quota) {
        syncGenerationQuota(requestError.quota);
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "生成失败，请稍后重试。已保留你填写的内容。",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function enrichFormForGeneration(sourceForm: DiagnosisForm) {
    if (!shouldAutoEnrichBeforeGeneration(sourceForm)) {
      return sourceForm;
    }

    try {
      setToast("正在读取公开主页信息并整理诊断输入...");
      const parsed = await requestAccountParse(sourceForm);
      const nextForm = mergeParsedAccountIntoForm(sourceForm, parsed);
      setForm(nextForm);
      return nextForm;
    } catch {
      return sourceForm;
    }
  }

  function clearAll() {
    setForm(createDefaultForm());
    setReport(null);
    setError("");
    setActiveStep(1);
    localStorage.removeItem(storageKey);
    setToast("已清空");
  }

  function startDiagnosis() {
    setReport(null);
    setActiveStep(1);
    window.setTimeout(() => {
      document.getElementById("diagnosis-tool")?.scrollIntoView({ behavior: "smooth" });
    }, 40);
  }

  function showExampleReport() {
    const sample = createSampleForm();
    setForm(sample);
    setPlan("advanced");
    setReport(null);
    setActiveStep(3);
    void generateReport("full", sample, "advanced", { consumeQuota: false });
  }

  if (isAuthLoading) {
    return <DiagnosisAuthGate isLoading />;
  }

  if (!user) {
    return <DiagnosisAuthGate />;
  }

  const inferredAccountId = form.account.accountId || extractAccountIdFromText(form.account.name);
  const recognizedRows = [
    ["平台", form.account.platform || "待补充"],
    ["账号名称", normalizeAccountNameValue(form.account.name, inferredAccountId) || "待补充"],
    ["账号ID", inferredAccountId || "待补充"],
    ["账号简介", form.account.intro || "待补充"],
    ["粉丝数", form.account.followers || "待补充"],
    ["近期内容数量", `${form.recentContents.filter(hasRecentContent).length} 条`],
    ["平均播放/阅读", form.account.avgViews || averageViews(form.recentContents) || "待补充"],
  ];
  const hasRecognitionSummary = recognizedRows.some(([, value]) => value !== "待补充" && value !== "0 条");

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200/80 bg-white/88">
        <div className="app-container py-12 sm:py-14 lg:py-16">
          <div className="max-w-4xl">
            <p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800 shadow-sm">
              New Media Growth Agent
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              新媒体账号体检 Agent
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              选择平台并填写账号名或账号ID，AI 会结合你补充的简介、粉丝数和近期内容，生成账号诊断报告。
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800"
                onClick={startDiagnosis}
                type="button"
              >
                开始账号体检
              </button>
              <button
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50"
                onClick={showExampleReport}
                type="button"
              >
                查看示例报告
              </button>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {featureTags.map((tag) => (
                <span
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {report ? (
        <ReportWorkbench
          form={form}
          generationRemaining={remainingGenerations}
          moduleIds={visibleModules}
          onClear={clearAll}
          onCopyFull={() =>
            void copyText(reportToMarkdown(report, visibleModules)).then(() => setToast("完整报告已复制"))
          }
          onCopyModule={(moduleId) =>
            void copyText(`## ${moduleLabels[moduleId]}\n${compactText(report.sections?.[moduleId])}`).then(() =>
              setToast(`${moduleLabels[moduleId]}已复制`),
            )
          }
          onGenerate={(focus) => void generateReport(focus)}
          onPrint={() => window.print()}
          onSaveDraft={() => setToast("草稿已保存到本地")}
          onShowExample={showExampleReport}
          onStartOver={startDiagnosis}
          report={report}
        />
      ) : (
        <main className="app-container py-8 sm:py-10" id="diagnosis-tool">
          <Stepper activeStep={activeStep} form={form} />

          <div className="mt-6">
            {activeStep === 1 ? (
              <StepOne
                form={form}
                hasRecognitionSummary={hasRecognitionSummary}
                isRecognizing={isRecognizing}
                onFillSample={fillSample}
                onOpenDrawer={() => setIsDrawerOpen(true)}
                onRecognize={recognizeAccountWithParser}
                onUpdateAccount={updateAccount}
                onUpdateRecognition={updateRecognition}
                recognitionNotes={form.recognition.notes}
                recognizedRows={recognizedRows}
              />
            ) : null}

            {activeStep === 2 ? (
              <StepTwo
                form={form}
                onOpenDrawer={() => setIsDrawerOpen(true)}
                onUpdateAccount={updateAccount}
              />
            ) : null}

            {activeStep === 3 ? (
              <StepThree
                error={error}
                generationRemaining={remainingGenerations}
                isGenerating={isGenerating}
                onGenerate={() => void generateReport()}
                plan={plan}
                setPlan={setPlan}
              />
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={activeStep === 1 || isGenerating}
              onClick={() => setActiveStep((current) => (current === 3 ? 2 : 1))}
              type="button"
            >
              上一步
            </button>
            {activeStep < 3 ? (
              <button
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800"
                onClick={() => setActiveStep((current) => (current === 1 ? 2 : 3))}
                type="button"
              >
                {activeStep === 1 ? "下一步：确认目标" : "下一步：生成诊断报告"}
              </button>
            ) : null}
          </div>
        </main>
      )}

      <AdvancedDrawer
        form={form}
        isOpen={isDrawerOpen}
        onAddCompetitor={() =>
          setForm((current) => ({
            ...current,
            competitors: [...current.competitors, createCompetitor()].slice(0, 3),
          }))
        }
        onAddContent={() =>
          setForm((current) => ({
            ...current,
            recentContents: [...current.recentContents, createRecentContent()].slice(0, 10),
          }))
        }
        onClose={() => setIsDrawerOpen(false)}
        onRemoveCompetitor={(index) =>
          setForm((current) => ({
            ...current,
            competitors:
              current.competitors.length <= 1
                ? current.competitors
                : current.competitors.filter((_, itemIndex) => itemIndex !== index),
          }))
        }
        onRemoveContent={(index) =>
          setForm((current) => ({
            ...current,
            recentContents:
              current.recentContents.length <= 1
                ? current.recentContents
                : current.recentContents.filter((_, itemIndex) => itemIndex !== index),
          }))
        }
        onSave={() => {
          setIsDrawerOpen(false);
          setToast("补充信息已保存");
        }}
        onSkip={() => {
          setIsDrawerOpen(false);
          setToast("已暂时跳过补充信息");
        }}
        onUpdateAccount={updateAccount}
        onUpdateBestContent={(value) => setForm((current) => ({ ...current, bestContent: value }))}
        onUpdateContentCase={updateContentCase}
        onUpdateCompetitor={updateCompetitor}
        onUpdateContent={updateContent}
        onUpdateMonetization={updateMonetization}
        onUpdateWorstContent={(value) => setForm((current) => ({ ...current, worstContent: value }))}
        onRecognizeContentCase={(kind) => void recognizeContentCase(kind)}
      />

      <div
        className={`fixed bottom-5 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl transition ${
          toast ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {toast}
      </div>
    </div>
  );
}

function DiagnosisAuthGate({ isLoading = false }: { isLoading?: boolean }) {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200/80 bg-white/88">
        <div className="app-container py-12 sm:py-14 lg:py-16">
          <div className="max-w-4xl">
            <p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800 shadow-sm">
              New Media Growth Agent
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              新媒体账号体检 Agent
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              选择平台并填写账号名或账号ID，AI 会结合你补充的简介、粉丝数和近期内容，生成账号诊断报告。
            </p>
          </div>
        </div>
      </section>

      <section className="app-container py-10">
        <div className="premium-card max-w-2xl p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">登录后使用</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            {isLoading ? "正在确认登录状态..." : loginRequiredMessage}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            每个登录账号每天可生成 5 次账号诊断报告，次数由后端数据库记录。
          </p>
          {!isLoading ? (
            <a
              className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800"
              href="/sign-in?next=/tools/media-account-diagnosis"
            >
              去登录
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Stepper({ activeStep, form }: { activeStep: StepId; form: DiagnosisForm }) {
  const stepItems: Array<{ id: StepId; label: string; complete: boolean }> = [
    {
      id: 1,
      label: "填写账号信息",
      complete: Boolean(form.account.platform && (form.account.name || form.account.accountId)),
    },
    {
      id: 2,
      label: "确认目标",
      complete: Boolean(
        (form.account.biggestProblem.trim() || form.account.primaryGoal.trim()) &&
          (form.account.targetCustomer.trim() || form.account.primaryGoal.trim()),
      ),
    },
    {
      id: 3,
      label: "生成诊断报告",
      complete: false,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-3">
        {stepItems.map((step) => {
          const isActive = activeStep === step.id;
          return (
            <div
              aria-current={isActive ? "step" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                isActive ? "bg-blue-50 text-blue-900" : "bg-slate-50 text-slate-600"
              }`}
              key={step.id}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                  step.complete
                    ? "bg-blue-700 text-white"
                    : isActive
                      ? "bg-slate-950 text-white"
                      : "bg-white text-slate-500"
                }`}
              >
                {step.id}
              </span>
              <span className="text-sm font-semibold">Step {step.id}：{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepOne({
  form,
  hasRecognitionSummary,
  isRecognizing,
  onFillSample,
  onOpenDrawer,
  onRecognize,
  onUpdateAccount,
  onUpdateRecognition,
  recognitionNotes,
  recognizedRows,
}: {
  form: DiagnosisForm;
  hasRecognitionSummary: boolean;
  isRecognizing: boolean;
  onFillSample: () => void;
  onOpenDrawer: () => void;
  onRecognize: () => void;
  onUpdateAccount: (key: keyof DiagnosisForm["account"], value: string) => void;
  onUpdateRecognition: (key: keyof DiagnosisForm["recognition"], value: string | string[]) => void;
  recognitionNotes: string[];
  recognizedRows: string[][];
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="premium-card p-5 sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Step 1</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">填写账号信息</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            不需要复制复杂链接，填写平台账号名或平台号即可。若你愿意，也可以补充主页简介、粉丝数和近期内容，让报告更精准。
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]">
            <SelectField
              label="选择平台 *"
              onChange={(value) => onUpdateAccount("platform", value)}
              options={platformOptions}
              value={form.account.platform}
            />
            <TextField
              label="账号名称/昵称"
              onChange={(value) => {
                onUpdateAccount("name", value);
                const parsedAccountId = extractAccountIdFromText(value);
                if (parsedAccountId && !form.account.accountId) {
                  onUpdateAccount("accountId", parsedAccountId);
                }
              }}
              placeholder={getAccountNamePlaceholder(form.account.platform)}
              value={form.account.name}
            />
            <TextField
              label="账号ID / 平台号"
              onChange={(value) => onUpdateAccount("accountId", value)}
              placeholder={getAccountIdPlaceholder(form.account.platform)}
              value={form.account.accountId}
            />
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            账号名称和账号ID二选一即可；如果你知道小红书号、抖音号、B站 UID 等平台号，优先填账号ID会更稳定。
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="账号主页链接，可选"
              onChange={(value) => onUpdateRecognition("accountUrl", value)}
              placeholder="链接仅作为辅助参考，不保证每个平台都能自动读取。"
              value={form.recognition.accountUrl}
            />
            <TextField
              label="粉丝数，可选"
              onChange={(value) => onUpdateAccount("followers", value)}
              placeholder="例如：8600、2.3万"
              value={form.account.followers}
            />
          </div>

          <TextareaField
            label="账号简介/主页文案，可选"
            onChange={(value) => onUpdateAccount("intro", value)}
            placeholder="可以粘贴主页简介、置顶介绍、账号定位文案。"
            value={form.account.intro}
          />

          <TextareaField
            label="最近内容数据，可选"
            onChange={(value) => onUpdateRecognition("rawText", value)}
            placeholder="例如：标题、播放/阅读、点赞、收藏、评论、涨粉等。也可以直接粘贴从平台主页复制出来的近期内容信息。"
            value={form.recognition.rawText}
          />

          <label className="grid gap-2">
            <FieldLabel>上传截图，可选</FieldLabel>
            <input
              accept="image/*"
              className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpdateRecognition("screenshotName", file.name);
              }}
              type="file"
            />
            <span className="text-sm leading-6 text-slate-500">
              截图识别功能后续上线，当前请优先填写账号名和主页信息。
              {form.recognition.screenshotName ? ` 已选择：${form.recognition.screenshotName}` : ""}
            </span>
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isRecognizing}
            onClick={onRecognize}
            type="button"
          >
            {isRecognizing ? "整理中..." : "智能整理信息"}
          </button>
          <button
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50"
            onClick={onFillSample}
            type="button"
          >
            填入示例数据
          </button>
        </div>
      </div>

      <aside className="soft-card p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">诊断输入摘要</p>
        <div className="mt-4 grid gap-3">
          {recognizedRows.map(([label, value]) => (
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0" key={label}>
              <span className="text-sm text-slate-500">{label}</span>
              <strong className="max-w-[190px] break-words text-right text-sm text-slate-950">{value}</strong>
            </div>
          ))}
        </div>
        {recognitionNotes.length ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">识别线索</p>
            <ul className="mt-2 grid gap-1 text-xs leading-5 text-slate-600">
              {recognitionNotes.slice(0, 5).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <button
          className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50"
          onClick={onOpenDrawer}
          type="button"
        >
          信息不准确？点击修改
        </button>
        {!hasRecognitionSummary ? (
          <p className="mt-3 text-sm leading-6 text-slate-500">
            只填写平台和账号名或账号ID也可以进入下一步，补充简介和内容数据会让报告更精准。
          </p>
        ) : null}
      </aside>
    </section>
  );
}

function StepTwo({
  form,
  onOpenDrawer,
  onUpdateAccount,
}: {
  form: DiagnosisForm;
  onOpenDrawer: () => void;
  onUpdateAccount: (key: keyof DiagnosisForm["account"], value: string) => void;
}) {
  return (
    <section className="premium-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Step 2</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">确认目标</h2>
        </div>
        <button
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-50"
          onClick={onOpenDrawer}
          type="button"
        >
          补充更多信息，提高报告准确度
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <RequiredInfoCard
          label="当前最想解决的问题"
          onChange={(value) => onUpdateAccount("biggestProblem", value)}
          placeholder="例如：想涨粉、想获客、想成交、账号定位不清、内容有流量但不转化"
          required
          value={form.account.biggestProblem}
        />
        <RequiredInfoCard
          label="目标客户或账号目标"
          onChange={(value) => onUpdateAccount("targetCustomer", value)}
          placeholder="例如：想用 AI 提效的职场新人；如果暂时不清楚客户，也可以写账号目标：先涨粉、做同城获客、提升私信咨询"
          required
          value={form.account.targetCustomer}
        />
        <RequiredInfoCard
          label="产品或服务（可选）"
          onChange={(value) => onUpdateAccount("productService", value)}
          placeholder="例如：课程、咨询、实体产品、门店套餐、社群服务"
          value={form.account.productService}
        />
      </div>
    </section>
  );
}

function RequiredInfoCard({
  label,
  onChange,
  placeholder,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="grid min-h-[210px] gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <FieldLabel>{label}{required ? " *" : ""}</FieldLabel>
      <textarea
        className="min-h-32 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function StepThree({
  error,
  generationRemaining,
  isGenerating,
  onGenerate,
  plan,
  setPlan,
}: {
  error: string;
  generationRemaining: number;
  isGenerating: boolean;
  onGenerate: () => void;
  plan: PlanId;
  setPlan: (plan: PlanId) => void;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="premium-card p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Step 3</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">生成诊断报告</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {reportPlans.map((item) => (
            <button
              className={`rounded-2xl border p-4 text-left transition ${
                plan === item.id
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-blue-200"
              }`}
              key={item.id}
              onClick={() => setPlan(item.id)}
              type="button"
            >
              <span className="text-lg font-semibold text-slate-950">{item.name}</span>
              <span className="mt-3 block text-sm leading-6 text-slate-600">{item.description}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          今日剩余生成次数：{generationRemaining}/{generationQuotaLimit}
        </div>

        {generationRemaining <= 0 ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
            {generationQuotaExceededMessage}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        {isGenerating ? (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="font-semibold text-slate-950">正在生成账号诊断报告...</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              正在唤醒服务并生成报告，请稍候...
            </p>
          </div>
        ) : null}

        <button
          className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 disabled:opacity-50"
          disabled={isGenerating || generationRemaining <= 0}
          onClick={onGenerate}
          type="button"
        >
          {isGenerating ? "生成中..." : "生成账号诊断报告"}
        </button>
      </div>

      <aside className="soft-card p-5">
        <p className="font-semibold text-slate-950">生成后你将获得：</p>
        <ul className="mt-4 grid gap-3 text-sm text-slate-700">
          {deliverables.map((item) => (
            <li className="flex items-center gap-3" key={item}>
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}

function AdvancedDrawer({
  form,
  isOpen,
  onAddCompetitor,
  onAddContent,
  onClose,
  onRemoveCompetitor,
  onRemoveContent,
  onRecognizeContentCase,
  onSave,
  onSkip,
  onUpdateAccount,
  onUpdateBestContent,
  onUpdateContentCase,
  onUpdateCompetitor,
  onUpdateContent,
  onUpdateMonetization,
  onUpdateWorstContent,
}: {
  form: DiagnosisForm;
  isOpen: boolean;
  onAddCompetitor: () => void;
  onAddContent: () => void;
  onClose: () => void;
  onRemoveCompetitor: (index: number) => void;
  onRemoveContent: (index: number) => void;
  onRecognizeContentCase: (kind: "best" | "worst") => void;
  onSave: () => void;
  onSkip: () => void;
  onUpdateAccount: (key: keyof DiagnosisForm["account"], value: string) => void;
  onUpdateBestContent: (value: string) => void;
  onUpdateContentCase: (kind: "best" | "worst", key: keyof ContentCase, value: string) => void;
  onUpdateCompetitor: (index: number, key: keyof Competitor, value: string) => void;
  onUpdateContent: (index: number, key: keyof RecentContent, value: string) => void;
  onUpdateMonetization: (key: keyof DiagnosisForm["monetization"], value: string) => void;
  onUpdateWorstContent: (value: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      <button
        aria-label="关闭补充信息面板"
        className="absolute inset-0 bg-slate-950/28"
        onClick={onClose}
        type="button"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl shadow-slate-950/20">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">可选填写：信息越完整，报告越精准。</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                不影响当前流程，保存后会自动用于后续报告生成。
              </p>
            </div>
            <button
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950"
              onClick={onClose}
              type="button"
            >
              关闭
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-6">
            <DrawerSection title="账号基础信息">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="账号平台"
                  onChange={(value) => onUpdateAccount("platform", value)}
                  options={platformOptions}
                  value={form.account.platform}
                />
                <SelectField
                  label="账号领域"
                  onChange={(value) => onUpdateAccount("field", value)}
                  options={fieldOptions}
                  value={form.account.field}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="账号名称/昵称"
                  onChange={(value) => onUpdateAccount("name", value)}
                  placeholder={getAccountNamePlaceholder(form.account.platform)}
                  value={form.account.name}
                />
                <TextField
                  label="账号ID / 平台号"
                  onChange={(value) => onUpdateAccount("accountId", value)}
                  placeholder={getAccountIdPlaceholder(form.account.platform)}
                  value={form.account.accountId}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="当前粉丝数" onChange={(value) => onUpdateAccount("followers", value)} value={form.account.followers} />
                <TextField label="平均播放/阅读" onChange={(value) => onUpdateAccount("avgViews", value)} value={form.account.avgViews} />
              </div>
              <TextareaField label="账号简介" onChange={(value) => onUpdateAccount("intro", value)} value={form.account.intro} />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="当前主要目标"
                  onChange={(value) => onUpdateAccount("primaryGoal", value)}
                  options={["", "涨粉", "获客", "卖课", "卖产品", "打造IP", "引流私域", "其他"]}
                  value={form.account.primaryGoal}
                />
              </div>
              <TextareaField label="当前最大问题" onChange={(value) => onUpdateAccount("biggestProblem", value)} value={form.account.biggestProblem} />
            </DrawerSection>

            <DrawerSection
              action={
                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={onAddContent} type="button">
                  添加内容
                </button>
              }
              title="最近内容"
            >
              {form.recentContents.map((item, index) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={index}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">内容 {index + 1}</p>
                    <button
                      className="text-sm font-semibold text-red-700 disabled:opacity-40"
                      disabled={form.recentContents.length <= 1}
                      onClick={() => onRemoveContent(index)}
                      type="button"
                    >
                      删除
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3">
                    <TextField label="内容链接" onChange={(value) => onUpdateContent(index, "url", value)} value={item.url} />
                    <TextField label="内容标题" onChange={(value) => onUpdateContent(index, "title", value)} value={item.title} />
                    <div className="grid gap-3 sm:grid-cols-5">
                      <TextField label="播放/阅读" onChange={(value) => onUpdateContent(index, "views", value)} value={item.views} />
                      <TextField label="点赞" onChange={(value) => onUpdateContent(index, "likes", value)} value={item.likes} />
                      <TextField label="收藏" onChange={(value) => onUpdateContent(index, "saves", value)} value={item.saves} />
                      <TextField label="评论" onChange={(value) => onUpdateContent(index, "comments", value)} value={item.comments} />
                      <TextField label="涨粉" onChange={(value) => onUpdateContent(index, "follows", value)} value={item.follows} />
                    </div>
                    <TextareaField label="正文或脚本" onChange={(value) => onUpdateContent(index, "body", value)} value={item.body} />
                  </div>
                </div>
              ))}
            </DrawerSection>

            <DrawerSection title="最好/最差内容">
              <div className="grid gap-4">
                <ContentCaseEditor
                  kind="best"
                  onRecognize={() => onRecognizeContentCase("best")}
                  onUpdate={(key, value) => onUpdateContentCase("best", key, value)}
                  title="表现最好内容"
                  value={form.bestContentCase}
                />
                <ContentCaseEditor
                  kind="worst"
                  onRecognize={() => onRecognizeContentCase("worst")}
                  onUpdate={(key, value) => onUpdateContentCase("worst", key, value)}
                  title="表现最差内容"
                  value={form.worstContentCase}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextareaField label="表现最好内容补充说明" onChange={onUpdateBestContent} value={form.bestContent} />
                  <TextareaField label="表现最差内容补充说明" onChange={onUpdateWorstContent} value={form.worstContent} />
                </div>
              </div>
            </DrawerSection>

            <DrawerSection
              action={
                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={onAddCompetitor} type="button">
                  添加竞品
                </button>
              }
              title="竞品账号"
            >
              {form.competitors.map((item, index) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={index}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">竞品 {index + 1}</p>
                    <button
                      className="text-sm font-semibold text-red-700 disabled:opacity-40"
                      disabled={form.competitors.length <= 1}
                      onClick={() => onRemoveCompetitor(index)}
                      type="button"
                    >
                      删除
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextField label="竞品账号名称" onChange={(value) => onUpdateCompetitor(index, "name", value)} value={item.name} />
                      <TextField label="竞品领域" onChange={(value) => onUpdateCompetitor(index, "field", value)} value={item.field} />
                    </div>
                    <TextareaField label="竞品简介" onChange={(value) => onUpdateCompetitor(index, "intro", value)} value={item.intro} />
                    <TextField label="爆款标题" onChange={(value) => onUpdateCompetitor(index, "viralTitle", value)} value={item.viralTitle} />
                    <TextareaField label="哪里做得好" onChange={(value) => onUpdateCompetitor(index, "strength", value)} value={item.strength} />
                  </div>
                </div>
              ))}
            </DrawerSection>

            <DrawerSection title="变现资源">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="希望实现的商业结果"
                  onChange={(value) => onUpdateMonetization("businessResult", value)}
                  value={form.monetization.businessResult}
                />
                <SelectField
                  label="是否已有产品"
                  onChange={(value) => onUpdateMonetization("hasProduct", value)}
                  options={["有", "没有", "准备中"]}
                  value={form.monetization.hasProduct}
                />
                <TextField label="价格区间" onChange={(value) => onUpdateMonetization("priceRange", value)} value={form.monetization.priceRange} />
                <SelectField
                  label="私域承接"
                  onChange={(value) => onUpdateMonetization("privateTraffic", value)}
                  options={["没有", "微信", "企微", "社群", "公众号", "其他"]}
                  value={form.monetization.privateTraffic}
                />
                <SelectField
                  label="团队配置"
                  onChange={(value) => onUpdateMonetization("team", value)}
                  options={["个人", "2-3人小团队", "公司团队", "外包协作"]}
                  value={form.monetization.team}
                />
              </div>
              <TextField label="内容更新频率" onChange={(value) => onUpdateMonetization("contentFrequency", value)} value={form.monetization.contentFrequency} />
            </DrawerSection>
          </div>
        </div>

        <div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-2">
          <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={onSave} type="button">
            保存补充信息
          </button>
          <button className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950" onClick={onSkip} type="button">
            暂时跳过
          </button>
        </div>
      </aside>
    </div>
  );
}

function DrawerSection({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {action}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function ContentCaseEditor({
  onRecognize,
  onUpdate,
  title,
  value,
}: {
  kind: "best" | "worst";
  onRecognize: () => void;
  onUpdate: (key: keyof ContentCase, value: string) => void;
  title: string;
  value: ContentCase;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-slate-950">{title}</p>
        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950"
          onClick={onRecognize}
          type="button"
        >
          识别标题和数据
        </button>
      </div>
      <div className="mt-3 grid gap-3">
        <TextField label="内容链接" onChange={(next) => onUpdate("url", next)} value={value.url} />
        <TextField label="标题（必填）" onChange={(next) => onUpdate("title", next)} value={value.title} />
        <div className="grid gap-3 sm:grid-cols-5">
          <TextField label="播放/阅读" onChange={(next) => onUpdate("views", next)} value={value.views} />
          <TextField label="点赞" onChange={(next) => onUpdate("likes", next)} value={value.likes} />
          <TextField label="收藏" onChange={(next) => onUpdate("saves", next)} value={value.saves} />
          <TextField label="评论" onChange={(next) => onUpdate("comments", next)} value={value.comments} />
          <TextField label="涨粉" onChange={(next) => onUpdate("follows", next)} value={value.follows} />
        </div>
        <TextareaField label="内容正文/脚本" onChange={(next) => onUpdate("body", next)} value={value.body} />
        <TextareaField label="你觉得为什么好/差" onChange={(next) => onUpdate("reason", next)} value={value.reason} />
      </div>
    </div>
  );
}

function TextField({
  label,
  onChange,
  placeholder = "",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <input
        className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function TextareaField({
  label,
  onChange,
  placeholder = "",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        className="min-h-24 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <select
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || "请选择"}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReportWorkbench({
  form,
  generationRemaining,
  moduleIds,
  onClear,
  onCopyFull,
  onCopyModule,
  onGenerate,
  onPrint,
  onSaveDraft,
  onShowExample,
  onStartOver,
  report,
}: {
  form: DiagnosisForm;
  generationRemaining: number;
  moduleIds: string[];
  onClear: () => void;
  onCopyFull: () => void;
  onCopyModule: (moduleId: string) => void;
  onGenerate: (focus: string) => void;
  onPrint: () => void;
  onSaveDraft: () => void;
  onShowExample: () => void;
  onStartOver: () => void;
  report: DiagnosisReport;
}) {
  const scores = report.scores ?? {};
  const topProblems = (report.problemTags ?? []).slice(0, 3);
  const topActions = getTopActions(report);

  return (
    <main className="app-container py-8 sm:py-10" id="report-workbench">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">报告工作台</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {report.title ?? "《新媒体账号增长诊断报告》"}
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            今日剩余生成次数：{generationRemaining}/{generationQuotaLimit}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950" onClick={onCopyFull} type="button">
            复制报告
          </button>
          <button className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950" onClick={onPrint} type="button">
            导出 PDF
          </button>
          <button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => onGenerate("full")} type="button">
            重新生成
          </button>
          <MenuButton
            items={[
              ["生成 7 天计划", () => onGenerate("sevenDayPlan")],
              ["生成 30 天计划", () => onGenerate("thirtyDayPlan")],
              ["生成私信话术", () => onGenerate("privateTrafficScripts")],
              ["生成标题优化", () => onGenerate("titleCover")],
              ["生成主页简介", () => onGenerate("profileConversion")],
            ]}
            label="继续生成"
          />
          <MenuButton
            items={[
              ["清空", onClear],
              ["保存草稿", onSaveDraft],
              ["查看示例报告", onShowExample],
              ["回到体检流程", onStartOver],
            ]}
            label="更多"
          />
        </div>
      </div>

      <section className="premium-card mt-6 p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-sm font-semibold text-slate-300">综合评分</p>
            <strong className="mt-4 block text-6xl leading-none">{scores.overall ?? 0}</strong>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-blue-400"
                style={{ width: `${Math.max(0, Math.min(100, scores.overall ?? 0))}%` }}
              />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <p className="text-sm font-semibold text-slate-500">一句话判断</p>
              <p className="mt-2 text-xl font-semibold leading-8 text-slate-950">
                {report.oneLineJudgement || "基于现有信息，账号需要先统一定位、主页承接和内容转化链路。"}
              </p>
            </div>
            <ConclusionList items={topProblems} title="最关键的 3 个问题" />
            <ConclusionList items={topActions} title="最优先改的 3 件事" />
            <div>
              <p className="text-sm font-semibold text-slate-500">核心问题标签</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(report.problemTags ?? []).map((tag) => (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-5">
        <ScoreDetails scores={scores} />
        {moduleIds.map((moduleId) => (
          <ReportSection
            form={form}
            key={moduleId}
            moduleId={moduleId}
            onCopy={() => onCopyModule(moduleId)}
            value={report.sections?.[moduleId]}
          />
        ))}
      </div>
    </main>
  );
}

function MenuButton({
  items,
  label,
}: {
  items: Array<[string, () => void]>;
  label: string;
}) {
  return (
    <details className="relative">
      <summary className="list-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950">
        {label}
      </summary>
      <div className="absolute right-0 z-20 mt-2 grid min-w-48 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
        {items.map(([itemLabel, action]) => (
          <button
            className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            key={itemLabel}
            onClick={action}
            type="button"
          >
            {itemLabel}
          </button>
        ))}
      </div>
    </details>
  );
}

function ConclusionList({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <ol className="mt-3 grid gap-2 text-sm text-slate-700">
        {(items.length ? items : ["信息不足，建议先补充账号和商业目标。"]).map((item, index) => (
          <li className="flex gap-2" key={`${item}-${index}`}>
            <span className="font-semibold text-blue-700">{index + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ScoreDetails({ scores }: { scores: Record<string, number> }) {
  return (
    <section className="premium-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-slate-950">评分详情</h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
          综合评分 {scores.overall ?? 0}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(scoreLabels)
          .filter(([key]) => key !== "overall")
          .map(([key, label]) => {
            const score = scores[key] ?? 0;
            return (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={key}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-600">{label}</span>
                  <strong className="text-slate-950">{score}</strong>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-700"
                    style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}

function ReportSection({
  form,
  moduleId,
  onCopy,
  value,
}: {
  form: DiagnosisForm;
  moduleId: string;
  onCopy: () => void;
  value: unknown;
}) {
  if (moduleId === "titleCover") return <TitleCoverReport onCopy={onCopy} value={value} />;
  if (moduleId === "profileConversion") return <ProfileConversionReport beforeIntro={form.account.intro} onCopy={onCopy} value={value} />;
  if (moduleId === "sevenDayPlan") return <SevenDayPlanReport onCopy={onCopy} value={value} />;
  if (moduleId === "thirtyDayPlan") return <ThirtyDayPlanReport onCopy={onCopy} value={value} />;
  if (moduleId === "privateTrafficScripts") return <PrivateTrafficReport onCopy={onCopy} value={value} />;
  if (moduleId === "actionChecklist") return <ChecklistReport onCopy={onCopy} value={value} />;

  return <GenericReportModule moduleId={moduleId} onCopy={onCopy} value={value} />;
}

function ModuleShell({
  children,
  conclusion,
  onCopy,
  title,
}: {
  children: ReactNode;
  conclusion: string;
  onCopy: () => void;
  title: string;
}) {
  return (
    <section className="premium-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{conclusion}</p>
        </div>
        <button
          className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950"
          onClick={onCopy}
          type="button"
        >
          复制本模块
        </button>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function GenericReportModule({
  moduleId,
  onCopy,
  value,
}: {
  moduleId: string;
  onCopy: () => void;
  value: unknown;
}) {
  const insight = getModuleInsight(moduleId, value);
  return (
    <ModuleShell conclusion={insight.conclusion} onCopy={onCopy} title={moduleLabels[moduleId] ?? "报告模块"}>
      <div className="grid gap-4 lg:grid-cols-3">
        <ReportBlock items={insight.analysis} title="问题分析" />
        <ReportBlock items={insight.suggestions} title="优化建议" />
        <ReportBlock items={insight.copyable} title="可复制内容" />
      </div>
    </ModuleShell>
  );
}

function TitleCoverReport({ onCopy, value }: { onCopy: () => void; value: unknown }) {
  const insight = getModuleInsight("titleCover", value);
  const titles = extractStringsByKey(value, /标题/).slice(0, 12);
  const covers = extractStringsByKey(value, /封面|文案/).slice(0, 12);

  return (
    <ModuleShell conclusion={insight.conclusion} onCopy={onCopy} title={moduleLabels.titleCover}>
      <div className="grid gap-4 lg:grid-cols-2">
        <CopyList items={titles} title="标题建议" />
        <CopyList items={covers} title="封面文案" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ReportBlock items={insight.analysis} title="问题分析" />
        <ReportBlock items={insight.suggestions} title="优化建议" />
      </div>
    </ModuleShell>
  );
}

function ProfileConversionReport({
  beforeIntro,
  onCopy,
  value,
}: {
  beforeIntro: string;
  onCopy: () => void;
  value: unknown;
}) {
  const insight = getModuleInsight("profileConversion", value);
  const after = extractFirstStringByKey(value, /优化后|主页简介|简介/) || insight.copyable[0] || "请补充账号简介后生成更具体的主页简介。";

  return (
    <ModuleShell conclusion={insight.conclusion} onCopy={onCopy} title={moduleLabels.profileConversion}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Before</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">{beforeIntro || "当前简介待补充"}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800">After</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-950">{after}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ReportBlock items={insight.analysis} title="问题分析" />
        <ReportBlock items={insight.suggestions} title="优化建议" />
      </div>
    </ModuleShell>
  );
}

function SevenDayPlanReport({ onCopy, value }: { onCopy: () => void; value: unknown }) {
  const rows = asObjectArray(value);
  const insight = getModuleInsight("sevenDayPlan", value);

  return (
    <ModuleShell conclusion={insight.conclusion} onCopy={onCopy} title={moduleLabels.sevenDayPlan}>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["日期", "目标", "任务", "输出物"].map((header) => (
                <th className="px-4 py-3 font-semibold text-slate-700" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {(rows.length ? rows : Array.from({ length: 7 }, (_, index) => ({ 任务: `Day ${index + 1}`, 目标: "待生成", 具体内容: "补充信息后生成", 输出物: "行动项" }))).map((row, index) => (
              <tr key={index}>
                <td className="px-4 py-3 font-semibold text-slate-950">{readLikely(row, [/任务/, /日期/, /day/i]) || `Day ${index + 1}`}</td>
                <td className="px-4 py-3 text-slate-700">{readLikely(row, [/目标/])}</td>
                <td className="px-4 py-3 text-slate-700">{readLikely(row, [/具体内容/, /任务/, /动作/])}</td>
                <td className="px-4 py-3 text-slate-700">{readLikely(row, [/输出物/, /交付/, /结果/])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModuleShell>
  );
}

function ThirtyDayPlanReport({ onCopy, value }: { onCopy: () => void; value: unknown }) {
  const rows = asObjectArray(value);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = rows[activeIndex] ?? rows[0];
  const insight = getModuleInsight("thirtyDayPlan", value);

  return (
    <ModuleShell conclusion={insight.conclusion} onCopy={onCopy} title={moduleLabels.thirtyDayPlan}>
      <div className="flex flex-wrap gap-2">
        {(rows.length ? rows : [{ 周: "第1周" }, { 周: "第2周" }, { 周: "第3周" }, { 周: "第4周" }]).map((row, index) => (
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              activeIndex === index ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700"
            }`}
            key={index}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            {readLikely(row, [/周/, /week/i]) || `第${index + 1}周`}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-500">本周主题</p>
        <h4 className="mt-2 text-xl font-semibold text-slate-950">{active ? readLikely(active, [/主题/, /方向/]) || "待生成" : "待生成"}</h4>
        <p className="mt-3 text-sm leading-6 text-slate-700">{active ? readLikely(active, [/任务/, /动作/, /计划/]) || compactText(active) : "补充竞品和内容数据后可生成更完整的 30 天计划。"}</p>
      </div>
    </ModuleShell>
  );
}

function PrivateTrafficReport({ onCopy, value }: { onCopy: () => void; value: unknown }) {
  const record = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const insight = getModuleInsight("privateTrafficScripts", value);
  const entries: Array<[string, unknown]> = Object.entries(record).length
    ? Object.entries(record)
    : [["私信第一句话", ["先问两个问题，方便给你更匹配的版本。"]]];

  return (
    <ModuleShell conclusion={insight.conclusion} onCopy={onCopy} title={moduleLabels.privateTrafficScripts}>
      <div className="grid gap-3">
        {entries.map(([scenario, item]) => (
          <details className="rounded-2xl border border-slate-200 bg-white p-4" key={scenario}>
            <summary className="font-semibold text-slate-950">{scenario}</summary>
            <div className="mt-3 text-sm leading-6 text-slate-700">
              <StructuredList value={item} />
            </div>
          </details>
        ))}
      </div>
    </ModuleShell>
  );
}

function ChecklistReport({ onCopy, value }: { onCopy: () => void; value: unknown }) {
  const rows = asObjectArray(value);
  const insight = getModuleInsight("actionChecklist", value);

  return (
    <ModuleShell conclusion={insight.conclusion} onCopy={onCopy} title={moduleLabels.actionChecklist}>
      <div className="grid gap-3">
        {(rows.length ? rows : [{ item: "补充账号信息后生成行动清单", why: "信息越完整，行动项越精准" }]).map((row, index) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-4" key={index}>
            <label className="flex items-start gap-3">
              <input className="mt-1 h-4 w-4 rounded border-slate-300" readOnly type="checkbox" />
              <span>
                <strong className="block text-slate-950">{readLikely(row, [/item/i, /事项/, /动作/, /任务/]) || `行动 ${index + 1}`}</strong>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{readLikely(row, [/why/i, /原因/, /价值/])}</span>
                <span className="mt-1 block text-sm leading-6 text-slate-700">{readLikely(row, [/how/i, /做法/, /方法/])}</span>
              </span>
            </label>
          </div>
        ))}
      </div>
    </ModuleShell>
  );
}

function ReportBlock({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="font-semibold text-slate-950">{title}</h4>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700">
        {(items.length ? items : ["暂无明确结论，建议补充更多账号信息后重新生成。"]).slice(0, 6).map((item, index) => (
          <li className="flex gap-2" key={`${item}-${index}`}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CopyList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="font-semibold text-slate-950">{title}</h4>
      <div className="mt-3 grid gap-2">
        {(items.length ? items : ["补充内容数据后生成可直接使用的文案。"]).map((item, index) => (
          <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3" key={`${item}-${index}`}>
            <p className="text-sm leading-6 text-slate-700">{item}</p>
            <button
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              onClick={() => void copyText(item)}
              type="button"
            >
              复制
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StructuredList({ value }: { value: unknown }) {
  const items = toDisplayStrings(value);
  return (
    <ul className="grid gap-2">
      {(items.length ? items : ["暂无明确话术"]).map((item, index) => (
        <li className="rounded-xl bg-slate-50 p-3" key={`${item}-${index}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function getModuleInsight(moduleId: string, value: unknown) {
  const all = toDisplayStrings(value).filter(Boolean);
  const conclusion = firstUsefulString(
    extractStringsByKey(value, /判断|结论|一句话|定位是否清晰|当前.*问题|主题/),
  ) || defaultConclusion(moduleId);

  return {
    analysis: extractStringsByKey(value, /问题|原因|差距|痛点|风险|不建议|当前|最大|区别/).slice(0, 6),
    conclusion,
    copyable: extractStringsByKey(value, /标题|话术|简介|文案|定位|清单|模板|入口|输出物|路径/).slice(0, 6),
    suggestions:
      extractStringsByKey(value, /建议|方向|路径|优化|动作|原则|比例|打法|承接|方式|设计/).slice(0, 6) ||
      all.slice(0, 4),
  };
}

function defaultConclusion(moduleId: string) {
  const labels: Record<string, string> = {
    actionChecklist: "按优先级完成这些动作，比一次性大改更容易看到数据变化。",
    competitorAnalysis: "竞品分析的重点是学习结构和转化链路，不复制人设与内容。",
    contentStructure: "内容需要从零散输出改为稳定栏目，方便平台和用户理解账号价值。",
    dataDiagnosis: "数据诊断优先看点击、互动、转粉和私域咨询是否连续衔接。",
    monetizationPath: "变现路径需要让内容、主页、私域和产品承接形成闭环。",
    positioning: "账号要先说清楚服务谁、解决什么问题、为什么值得信任。",
    privateTrafficScripts: "私域话术要自然承接用户动作，少推销，多判断需求。",
    profileConversion: "主页要从自我介绍改成转化入口。",
    sevenDayPlan: "7天计划用于快速修正主页、标题和内容测试节奏。",
    thirtyDayPlan: "30天计划用于稳定栏目、测试爆款方向并强化成交内容。",
    titleCover: "标题和封面要把人群、痛点和结果说得更具体。",
    userPersona: "目标用户越清楚，选题、标题和产品承接越容易精准。",
    viralOpportunities: "爆款机会来自具体人群、明确痛点和低门槛行动。",
  };
  return labels[moduleId] ?? "本模块基于现有信息生成，建议结合账号实际数据继续校准。";
}

function firstUsefulString(items: string[]) {
  return items.find((item) => item.length >= 6 && item.length <= 120) ?? "";
}

function extractFirstStringByKey(value: unknown, pattern: RegExp) {
  return extractStringsByKey(value, pattern)[0] ?? "";
}

function extractStringsByKey(value: unknown, pattern: RegExp): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractStringsByKey(item, pattern));
  }
  if (typeof value !== "object") return [];

  const result: string[] = [];
  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    if (pattern.test(key)) {
      result.push(...toDisplayStrings(item));
    }
    if (item && typeof item === "object") {
      result.push(...extractStringsByKey(item, pattern));
    }
  });
  return dedupeStrings(result);
}

function toDisplayStrings(value: unknown): string[] {
  if (Array.isArray(value)) return dedupeStrings(value.flatMap((item) => toDisplayStrings(item)));
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
      if (Array.isArray(item)) {
        return item.map((entry) => `${key}：${compactText(entry)}`).filter(Boolean);
      }
      if (item && typeof item === "object") {
        return [`${key}：${compactText(item)}`];
      }
      const text = String(item ?? "").trim();
      return text ? [`${key}：${text}`] : [];
    });
  }
  const text = String(value ?? "").trim();
  return text ? [text] : [];
}

function dedupeStrings(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function asObjectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
}

function readLikely(record: Record<string, unknown>, patterns: RegExp[]) {
  const entry = Object.entries(record).find(([key]) => patterns.some((pattern) => pattern.test(key)));
  return entry ? compactText(entry[1]) : "";
}

function getTopActions(report: DiagnosisReport) {
  const checklist = report.sections?.actionChecklist;
  if (Array.isArray(checklist)) {
    return checklist
      .map((item) => {
        if (item && typeof item === "object") {
          return readLikely(item as Record<string, unknown>, [/item/i, /事项/, /动作/, /任务/]) || compactText(item);
        }
        return compactText(item);
      })
      .filter(Boolean)
      .slice(0, 3);
  }
  return [];
}
