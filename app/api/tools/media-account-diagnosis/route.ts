import { NextResponse } from "next/server";
import { getCurrentAuthProfile } from "@/lib/auth/server";
import { logApiError } from "@/lib/server/monitoring";
import { enforceRateLimit, rateLimits } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

type DiagnosisRequest = {
  anonymousDeviceId?: string;
  consumeQuota?: boolean;
  focus?: string;
  form?: Record<string, unknown>;
  plan?: string;
};

type GenerationQuota = {
  date: string;
  generationCount: number;
};

type GenerationQuotaStore = typeof globalThis & {
  mediaAccountDiagnosisGenerationQuotaStore?: Map<string, GenerationQuota>;
};

type Scores = Record<string, number>;

type DiagnosisReport = {
  oneLineJudgement: string;
  problemTags: string[];
  scores: Scores;
  sections: Record<string, unknown>;
  title: string;
};

const scoreKeys = [
  "positioningClarity",
  "targetUserClarity",
  "contentVerticality",
  "titleAppeal",
  "profileConversion",
  "contentConsistency",
  "monetizationPotential",
  "privateTrafficAbility",
  "overall",
];
const generationQuotaLimit = 5;
const generationQuotaExceededMessage =
  "为保证生成质量与服务稳定，每个账号每天最多生成 5 次诊断报告。你今天的次数已用完，请明天再试。";
const providerRateLimitMessage = "当前生成请求较多，请稍后再试。";

class ProviderRateLimitError extends Error {
  constructor() {
    super(providerRateLimitMessage);
    this.name = "ProviderRateLimitError";
  }
}

const systemPrompt = `你是一名资深新媒体增长顾问，擅长小红书、抖音、视频号、B站、公众号账号诊断、内容增长、私域转化和商业变现。

你需要根据用户提供的账号链接识别信息、账号信息、近期内容、竞品信息和变现目标，生成一份专业、具体、可执行的新媒体账号增长诊断报告。不要泛泛而谈，不要输出空洞建议。每个判断都要尽量结合用户输入；信息不足时必须明确说明“基于现有信息推断”。

输出要求：
1. 只输出合法 JSON，不要 Markdown 代码块。
2. 所有字段使用简体中文。
3. 标题、封面文案、主页简介、私域话术必须可以直接复制使用。
4. 评分必须是 0-100 的整数。
5. 7天计划必须包含 Day 1 到 Day 7。
6. 至少输出 10 个标题建议和 10 个封面文案。
7. 爆款机会输出 5 个方向，每个方向给 3-5 个标题。

返回 JSON 结构：
{
  "title": "《新媒体账号增长诊断报告》",
  "oneLineJudgement": "当前账号一句话判断",
  "problemTags": ["定位不清晰", "主页转化弱"],
  "scores": {
    "positioningClarity": 0,
    "targetUserClarity": 0,
    "contentVerticality": 0,
    "titleAppeal": 0,
    "profileConversion": 0,
    "contentConsistency": 0,
    "monetizationPotential": 0,
    "privateTrafficAbility": 0,
    "overall": 0
  },
  "sections": {
    "positioning": {},
    "userPersona": {},
    "contentStructure": {},
    "titleCover": {},
    "dataDiagnosis": {},
    "profileConversion": {},
    "competitorAnalysis": {},
    "viralOpportunities": [],
    "monetizationPath": {},
    "sevenDayPlan": [],
    "thirtyDayPlan": [],
    "privateTrafficScripts": {},
    "actionChecklist": []
  }
}`;

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, rateLimits.chat);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const payload = (await request.json()) as DiagnosisRequest;
    const form = isRecord(payload.form) ? payload.form : {};
    const validationError = validateInput(form);

    if (validationError) {
      return NextResponse.json({ error: validationError, ok: false }, { status: 422 });
    }

    const quotaIdentity = await resolveQuotaIdentity(payload.anonymousDeviceId);
    const shouldConsumeQuota = payload.consumeQuota !== false;
    const quotaBefore = readServerGenerationQuota(quotaIdentity);

    if (shouldConsumeQuota && quotaBefore.generationCount >= generationQuotaLimit) {
      return NextResponse.json(
        {
          error: generationQuotaExceededMessage,
          ok: false,
          quota: toQuotaResponse(quotaBefore),
        },
        { status: 429 },
      );
    }

    let report: DiagnosisReport;

    try {
      report = await generateWithProvider({
        focus: payload.focus || "full",
        form,
        plan: payload.plan || "advanced",
      });
    } catch (providerError) {
      if (providerError instanceof ProviderRateLimitError) {
        return NextResponse.json(
          {
            error: providerRateLimitMessage,
            ok: false,
            quota: toQuotaResponse(quotaBefore),
          },
          { status: 429 },
        );
      }

      throw providerError;
    }

    const quotaAfter = shouldConsumeQuota ? incrementServerGenerationQuota(quotaIdentity) : quotaBefore;

    return NextResponse.json({ ok: true, quota: toQuotaResponse(quotaAfter), report });
  } catch (error) {
    logApiError("media_account_diagnosis_error", error, {
      path: new URL(request.url).pathname,
    });

    return NextResponse.json(
      {
        error: "生成失败，请稍后重试。已保留你填写的内容。",
        ok: false,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const quotaIdentity = await resolveQuotaIdentity(url.searchParams.get("anonymousDeviceId"));
    const quota = readServerGenerationQuota(quotaIdentity);

    return NextResponse.json({ ok: true, quota: toQuotaResponse(quota) });
  } catch (error) {
    logApiError("media_account_diagnosis_quota_error", error, {
      path: new URL(request.url).pathname,
    });

    return NextResponse.json(
      {
        error: "暂时无法读取生成次数，请稍后重试。",
        ok: false,
      },
      { status: 500 },
    );
  }
}

function validateInput(form: Record<string, unknown>) {
  const account = readRecord(form.account);
  const recognition = readRecord(form.recognition);
  const recentContents = Array.isArray(form.recentContents) ? form.recentContents : [];
  const hasSource =
    readString(recognition.accountUrl) ||
    readString(recognition.rawText) ||
    readString(recognition.screenshotName) ||
    recentContents.some((item) => {
      const content = readRecord(item);
      return readString(content.title) || readString(content.body) || readString(content.views);
    });

  if (!hasSource) return "请先粘贴账号链接、数据文本、上传截图或填写最近内容。";
  if (!readString(account.biggestProblem) && !readString(account.primaryGoal)) {
    return "请补充当前最想解决的问题。";
  }
  if (!readString(account.targetCustomer)) return "请补充目标客户，这会直接影响报告可执行性。";
  return "";
}

async function resolveQuotaIdentity(anonymousDeviceId: unknown) {
  const auth = await getCurrentAuthProfile();

  if (auth.user?.id) {
    return `user:${auth.user.id}`;
  }

  const deviceId = readString(anonymousDeviceId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return `device:${deviceId || "missing"}`;
}

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getServerQuotaStore() {
  const store = globalThis as GenerationQuotaStore;

  if (!store.mediaAccountDiagnosisGenerationQuotaStore) {
    store.mediaAccountDiagnosisGenerationQuotaStore = new Map();
  }

  return store.mediaAccountDiagnosisGenerationQuotaStore;
}

function readServerGenerationQuota(identity: string): GenerationQuota {
  const today = getLocalDateKey();
  const store = getServerQuotaStore();
  const key = `${identity}:${today}`;
  const quota = store.get(key);

  if (!quota || quota.date !== today) {
    const nextQuota = { date: today, generationCount: 0 };
    store.set(key, nextQuota);
    return nextQuota;
  }

  return quota;
}

function incrementServerGenerationQuota(identity: string) {
  const today = getLocalDateKey();
  const store = getServerQuotaStore();
  const key = `${identity}:${today}`;
  const current = readServerGenerationQuota(identity);
  const nextQuota = {
    date: today,
    generationCount: Math.min(generationQuotaLimit, current.generationCount + 1),
  };

  store.set(key, nextQuota);
  return nextQuota;
}

function toQuotaResponse(quota: GenerationQuota) {
  return {
    date: quota.date,
    generationCount: quota.generationCount,
    limit: generationQuotaLimit,
    remaining: Math.max(0, generationQuotaLimit - quota.generationCount),
  };
}

async function generateWithProvider({
  focus,
  form,
  plan,
}: {
  focus: string;
  form: Record<string, unknown>;
  plan: string;
}) {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  const useMoonshot = provider === "moonshot" || (!provider && Boolean(process.env.MOONSHOT_API_KEY));
  const apiKey = useMoonshot ? process.env.MOONSHOT_API_KEY : process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

  if (!apiKey) {
    return buildDemoReport(form);
  }

  const baseUrl = (
    useMoonshot
      ? process.env.MOONSHOT_BASE_URL || "https://api.moonshot.cn/v1"
      : process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.AI_MODEL || (useMoonshot ? "moonshot-v1-8k" : process.env.OPENAI_MODEL || "gpt-4o-mini");
  const requestBody: Record<string, unknown> = {
    messages: [
      { content: systemPrompt, role: "system" },
      {
        content: [
          `当前版本：${plan}`,
          `本次重点：${focus}`,
          "用户输入 JSON：",
          JSON.stringify(form, null, 2),
          "请基于这些信息生成完整结构化报告。如果数据来自识别结果，请明确哪些判断是基于现有信息推断。",
        ].join("\n"),
        role: "user",
      },
    ],
    model,
    response_format: { type: "json_object" },
    temperature: 0.35,
  };

  if (process.env.AI_DISABLE_RESPONSE_FORMAT === "true") {
    delete requestBody.response_format;
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      body: JSON.stringify(requestBody),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    return buildDemoReport(form);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");

    if (isProviderRateLimited(response.status, errorText)) {
      throw new ProviderRateLimitError();
    }

    return buildDemoReport(form);
  }

  const result = (await response.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string } }>;
  } | null;
  const content = result?.choices?.[0]?.message?.content;
  const parsed = extractJson(content);
  return normalizeReport(parsed, form);
}

function isProviderRateLimited(status: number, errorText: string) {
  const normalized = errorText.toLowerCase();

  return (
    status === 429 ||
    normalized.includes("rate_limit") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  );
}

function extractJson(content: unknown) {
  if (isRecord(content)) return content;
  const text = typeof content === "string" ? content.trim() : "";

  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    }
    return {};
  }
}

function normalizeReport(raw: Record<string, unknown>, form: Record<string, unknown>): DiagnosisReport {
  const fallback = buildDemoReport(form);
  const scores = readRecord(raw.scores);
  const normalizedScores: Scores = {};

  for (const key of scoreKeys) {
    normalizedScores[key] = clampScore(scores[key], fallback.scores[key]);
  }

  if (!raw.scores || !Number.isFinite(normalizedScores.overall)) {
    normalizedScores.overall = Math.round(
      scoreKeys
        .filter((key) => key !== "overall")
        .reduce((sum, key) => sum + normalizedScores[key], 0) / 8,
    );
  }

  return {
    oneLineJudgement: readString(raw.oneLineJudgement) || fallback.oneLineJudgement,
    problemTags: readStringArray(raw.problemTags).length
      ? readStringArray(raw.problemTags).slice(0, 8)
      : fallback.problemTags,
    scores: normalizedScores,
    sections: isRecord(raw.sections) ? raw.sections : fallback.sections,
    title: readString(raw.title) || "《新媒体账号增长诊断报告》",
  };
}

function buildDemoReport(form: Record<string, unknown>): DiagnosisReport {
  const account = readRecord(form.account);
  const recognition = readRecord(form.recognition);
  const platform = readString(account.platform) || inferPlatform(readString(recognition.accountUrl)) || "主平台";
  const field = readString(account.field) || "当前领域";
  const targetCustomer = readString(account.targetCustomer) || "目标用户";
  const product = readString(account.productService) || "产品/服务";
  const goal = readString(account.primaryGoal) || readString(account.biggestProblem) || "获客与转化";

  return {
    oneLineJudgement: `当前账号适合先围绕「${field} + ${targetCustomer}」统一定位，再用连续 7 天内容测试提升${goal}效率。`,
    problemTags: ["识别信息待完善", "标题结果感不足", "主页转化弱", "内容栏目需稳定", "私域引导不足"],
    scores: {
      positioningClarity: 68,
      targetUserClarity: 72,
      contentVerticality: 66,
      titleAppeal: 62,
      profileConversion: 55,
      contentConsistency: 58,
      monetizationPotential: 70,
      privateTrafficAbility: 52,
      overall: 63,
    },
    sections: {
      actionChecklist: [
        {
          item: "把主页简介改成“服务谁 + 解决什么问题 + 如何领取/咨询”",
          why: "用户进入主页后需要立刻判断是否值得关注和私信",
          how: `围绕${targetCustomer}写一句明确承诺，并放入私域入口`,
          expectedEffect: "提升关注率和私信率",
        },
        {
          item: "连续 7 天只测试 2-3 个核心痛点",
          why: "内容方向太散会降低平台和用户对账号的理解",
          how: "每天发一个痛点解决型内容，记录播放、收藏、评论和涨粉",
          expectedEffect: "更快找到可复制选题",
        },
      ],
      competitorAnalysis: {
        可以学习但不要照抄: ["学习竞品的标题结构、痛点表达和结尾引导，不照搬人设和案例"],
        差异化打法: [`在${platform}上强调自己的真实经验、案例过程和可交付资料`],
        差距: ["账号承接链路和栏目化表达还不够清晰"],
        爆款规律: ["标题包含明确结果、具体人群、低门槛动作"],
        竞品共同优势: ["场景具体", "标题直接", "有评论/私信引导"],
      },
      contentStructure: {
        当前内容最大问题: "内容可能有价值，但栏目和转化动作不够稳定。",
        建议内容比例: [
          { 原因: "建立专业度", 比例: "40%", 类型: "实用教程" },
          { 原因: "降低信任门槛", 比例: "25%", 类型: "案例拆解" },
          { 原因: "触发互动和收藏", 比例: "20%", 类型: "痛点解决" },
          { 原因: "承接商业目标", 比例: "10%", 类型: "产品/服务转化" },
          { 原因: "建立真人信任", 比例: "5%", 类型: "个人信任内容" },
        ],
      },
      dataDiagnosis: {
        下一步优化动作: ["把每条内容结尾统一加入评论/私信引导", "重点观察收藏率、评论率和转粉率"],
        可能原因: ["标题没有足够结果感", "主页没有明确承接", "内容缺少系列化栏目"],
        问题所在环节: "优先判断为点击、转粉和转化环节偏弱",
      },
      monetizationPath: {
        中价产品设计: [`围绕${product}设计训练营、陪跑或咨询服务`],
        免费内容引流方式: ["评论关键词领取清单/模板", "私信发送诊断表"],
        内容如何引导成交: ["内容结尾给出轻量 CTA：想要模板/方案可以评论关键词"],
        私域承接路径: ["内容评论 -> 私信 -> 企微/微信 -> 需求判断 -> 低价产品 -> 高价服务"],
        低价产品设计: ["资料包、模板包、入门小课"],
        高价服务设计: ["1v1 咨询、企业内训、长期陪跑"],
      },
      positioning: {
        一句话定位: `我帮助${targetCustomer}用${field}方法解决增长、效率或转化问题。`,
        不建议继续强化的方向: ["泛泛观点", "与目标客户无关的热点", "没有案例支撑的情绪内容"],
        当前账号像什么类型: `${platform}${field}知识/解决方案型账号`,
        当前定位最大问题: "账号价值点还需要更具体地绑定目标客户和商业结果。",
        定位是否清晰: "基于现有信息判断：有方向，但表达还可以更锐利。",
        建议定位方向: `${targetCustomer}的${field}增长/提效顾问`,
        适合的人设标签: ["实战型", "案例拆解型", "工具型", "陪跑顾问型"],
      },
      privateTrafficScripts: {
        判断客户需求的问题: ["你现在最想解决的是涨粉、获客还是成交？", "你现在有什么产品/服务在卖？"],
        客户犹豫时的回复话术: ["可以先从低成本资料包开始，跑通一个小结果后再决定是否做深度服务。"],
        引导购买低价产品的话术: [`我整理了一份适合${targetCustomer}的入门资料包，可以先用它把第一步跑起来。`],
        引导进入微信群企微的话术: ["我拉你进实操群，里面会发案例拆解和模板，适合边看边改。"],
        私信第一句话: ["看到你想要资料了，我先问两个问题，方便给你更匹配的版本。"],
        评论区回复话术: ["已整理，评论区不方便发完整内容，我私信你领取方式。"],
        短视频结尾引导话术: ["想要我用的模板，评论“诊断”，我发你一份可直接套用的版本。"],
      },
      profileConversion: {
        产品服务承接建议: [`用置顶内容解释${product}适合谁、不适合谁、能解决什么问题`],
        优化后的主页简介: `${field}增长顾问｜帮助${targetCustomer}解决内容增长和转化问题｜评论/私信领取诊断清单`,
        头像建议: "使用清晰真人头像或高识别度品牌头像，保持专业感。",
        昵称建议: `${readString(account.name) || field + "增长顾问"}｜${field}增长`,
        简介问题: ["服务对象不够具体", "缺少可复制的领取/咨询入口"],
        私域入口建议: ["评论关键词", "私信自动回复", "主页置顶领取入口"],
        置顶内容建议: ["账号介绍", "爆款教程", "客户案例", "产品/服务说明"],
      },
      sevenDayPlan: Array.from({ length: 7 }, (_, index) => ({
        具体内容: index === 0 ? "重写主页简介和置顶内容结构" : `发布 1 条${field}痛点解决内容`,
        任务: `Day ${index + 1}`,
        目标: index === 0 ? "提升主页承接" : "测试选题和标题",
        输出物: index === 0 ? "新版主页简介 + 置顶选题" : "1 条内容 + 数据记录",
      })),
      thirtyDayPlan: [
        { 周: "第1周", 主题: "账号定位强化", 任务: "统一主页、栏目和目标用户表达" },
        { 周: "第2周", 主题: "痛点内容测试", 任务: `围绕${targetCustomer}测试 10 个痛点` },
        { 周: "第3周", 主题: "案例和信任建设", 任务: "发布案例拆解、过程记录和用户反馈" },
        { 周: "第4周", 主题: "转化内容布局", 任务: "安排产品说明、私域引导和成交话术内容" },
      ],
      titleCover: {
        可直接使用的优化标题: [
          `我用${field}解决了一个最常见的增长问题`,
          `${targetCustomer}最容易踩的 3 个内容坑`,
          `别再这样做${platform}了，难怪不转化`,
          `7 天把账号主页改成能获客的样子`,
          `这类内容收藏高但不成交，原因在这里`,
          `从 0 到 1 做${field}账号，先改这 5 个地方`,
          `一个标题模板，让内容更有结果感`,
          `${targetCustomer}可以直接照着做的内容清单`,
          `账号不涨粉，通常不是因为你不努力`,
          `把主页这句话改掉，私信率会更高`,
        ],
        封面文案建议: [
          "不涨粉先看这里",
          "主页这样改",
          "7天内容计划",
          "标题别再这样写",
          "收藏高不成交？",
          "私域引导模板",
          "账号定位清单",
          "爆款选题公式",
          "新手避坑",
          "直接照做",
        ],
        当前标题主要问题: ["结果感不够强", "没有明确目标人群", "缺少具体场景"],
        标题优化原则: ["人群具体", "结果明确", "动作简单", "数字化表达"],
      },
      userPersona: {
        后续内容痛点方向: ["不知道发什么", "内容有流量但没咨询", "主页承接弱", "私域转化不自然"],
        当前可能吸引的人群: [targetCustomer, "对该领域感兴趣但付费意愿不明的人群"],
        最值得服务的人群: targetCustomer,
        目标用户核心痛点: ["缺方法", "缺案例", "缺执行路径", "缺转化话术"],
        高价值用户和低价值用户区别: ["高价值用户有明确问题和预算", "低价值用户只看热闹、不愿行动"],
      },
      viralOpportunities: [
        {
          contentFormats: ["图文", "口播", "案例拆解"],
          direction: "痛点解决型教程",
          titles: [`${targetCustomer}最该先改的 3 件事`, `别再这样做${platform}账号了`, "7天账号优化清单"],
          whyFit: "能同时提升收藏、关注和私信咨询。",
        },
        {
          contentFormats: ["图文", "实拍"],
          direction: "主页改造前后对比",
          titles: ["主页这样改，用户才知道该不该找你", "一个简介模板，让账号更像能成交的账号"],
          whyFit: "直观、低门槛、适合引导诊断服务。",
        },
      ],
    },
    title: "《新媒体账号增长诊断报告》",
  };
}

function inferPlatform(url: string) {
  const text = url.toLowerCase();
  if (/xiaohongshu|xhs|小红书|hongshu/.test(text)) return "小红书";
  if (/douyin|iesdouyin|抖音/.test(text)) return "抖音";
  if (/bilibili|b23\.tv|b站/.test(text)) return "B站";
  if (/weixin|mp\.weixin|公众号/.test(text)) return "公众号";
  if (/kuaishou|快手/.test(text)) return "快手";
  return "";
}

function readRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => readString(item)).filter(Boolean);
}

function clampScore(value: unknown, fallback: number) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
