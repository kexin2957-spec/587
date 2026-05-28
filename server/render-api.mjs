import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = Number(process.env.PORT || 10000);
const agentSlug = "media-account-diagnosis";
const generationQuotaLimit = 5;
const generationQuotaExceededMessage = "你今天的 5 次生成次数已用完，请明天再试。";
const providerRateLimitMessage = "当前生成请求较多，请稍后再试。";
const loginRequiredMessage = "请先登录后再使用账号诊断 Agent。";
const authConfigMissingMessage = "登录服务未配置，请联系管理员检查 Supabase 环境变量。";
const defaultAllowedOrigins = [
  "https://ai-agent-marketplace-tg4f.onrender.com",
  "http://localhost:3000",
  "http://localhost:3100",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3100",
];
let supabaseAuthClient = null;
let supabaseServiceClient = null;

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

const systemPrompt = `你是一名资深新媒体增长顾问，擅长小红书、抖音、视频号、B站、公众号账号诊断、内容增长、私域转化和商业变现。

你需要优先根据用户选择的平台、填写的账号名/账号ID、账号简介、粉丝数、近期内容、目标客户、产品服务和当前目标，生成一份专业、具体、可执行的新媒体账号增长诊断报告。账号主页链接只是辅助参考，不能假设已经自动抓取平台完整数据。不要泛泛而谈，不要输出空洞建议。每个判断都要尽量结合用户输入；信息不足时必须明确说明“基于现有信息推断”。

如果用户没有提供主页简介和近期内容数据，报告里必须说明：“由于你没有提供主页简介和近期内容数据，本报告会基于平台、账号名和目标进行基础诊断。补充内容数据后可获得更精准分析。”

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

class ProviderRateLimitError extends Error {
  constructor() {
    super(providerRateLimitMessage);
    this.name = "ProviderRateLimitError";
  }
}

app.disable("x-powered-by");
app.use(applyCors);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({
    aiProvider: process.env.AI_PROVIDER || "moonshot",
    authConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
    corsOrigins: getAllowedOrigins(),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
    hasMoonshotKey: Boolean(process.env.MOONSHOT_API_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    ok: true,
    service: "media-account-diagnosis-api",
    supabaseHost: getSupabaseHost(),
  });
});

app.get("/api/generate-report", async (request, response) => {
  const auth = await requireAuthenticatedUser(request);

  if (!auth.ok) {
    response.status(auth.status).json({ error: auth.error, ok: false });
    return;
  }

  const quota = await getQuotaForUser(auth.user.id);
  response.json({ ok: true, quota });
});

app.post("/api/generate-report", async (request, response) => {
  const payload = isRecord(request.body) ? request.body : {};
  const form = isRecord(payload.form) ? payload.form : {};
  const diagnosisInput = normalizeDiagnosisInput(form, payload.diagnosisInput || payload);
  const validationError = validateInput(form, diagnosisInput);

  if (validationError) {
    response.status(422).json({ error: validationError, ok: false });
    return;
  }

  const auth = await requireAuthenticatedUser(request);

  if (!auth.ok) {
    response.status(auth.status).json({ error: auth.error, ok: false });
    return;
  }

  const shouldConsumeQuota = payload.consumeQuota !== false;
  const quotaBefore = await getQuotaForUser(auth.user.id);
  let hasQuotaReservation = false;

  if (shouldConsumeQuota) {
    const reservation = await reserveQuotaForUser(auth.user.id);
    hasQuotaReservation = reservation.allowed;

    if (!reservation.allowed) {
      response.status(429).json({
        error: generationQuotaExceededMessage,
        ok: false,
        quota: reservation.quota,
      });
      return;
    }
  }

  try {
    const report = await generateWithProvider({
      diagnosisInput,
      focus: readString(payload.focus) || "full",
      form,
      plan: readString(payload.plan) || "advanced",
    });
    const quotaAfter = shouldConsumeQuota
      ? await completeReservedQuotaForUser(auth.user.id)
      : quotaBefore;

    response.json({
      ok: true,
      quota: quotaAfter,
      report,
    });
  } catch (error) {
    if (hasQuotaReservation) {
      await releaseReservedQuotaForUser(auth.user.id).catch((releaseError) => {
        console.error("media_account_quota_release_error", releaseError);
      });
    }

    if (error instanceof ProviderRateLimitError) {
      const quota = await getQuotaForUser(auth.user.id);
      response.status(429).json({
        error: providerRateLimitMessage,
        ok: false,
        quota,
      });
      return;
    }

    const quota = await getQuotaForUser(auth.user.id);
    console.error("media_account_diagnosis_render_error", error);
    response.status(500).json({
      error: "生成失败，请稍后重试。已保留你填写的内容。",
      ok: false,
      quota,
    });
  }
});

app.use((error, _request, response, _next) => {
  void _next;
  console.error("media_account_diagnosis_unhandled_error", error);

  if (response.headersSent) {
    return;
  }

  response.status(500).json({
    error: "生成失败，请稍后重试。已保留你填写的内容。",
    ok: false,
  });
});

app.listen(port, () => {
  console.log(`Media account diagnosis API listening on ${port}`);
});

function applyCors(request, response, next) {
  const allowedOrigins = getAllowedOrigins();
  const origin = request.headers.origin;

  if (!origin || allowedOrigins.includes("*")) {
    response.setHeader("Access-Control-Allow-Origin", "*");
  } else if (allowedOrigins.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  next();
}

function getAllowedOrigins() {
  const raw = [
    process.env.REPORT_API_ALLOWED_ORIGINS,
    process.env.FRONTEND_ORIGIN,
    process.env.NEXT_PUBLIC_SITE_URL,
    ...defaultAllowedOrigins,
  ]
    .filter(Boolean)
    .join(",");
  const origins = raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  return origins.length ? origins : ["*"];
}

async function requireAuthenticatedUser(request) {
  const token = getBearerToken(request);

  if (!token) {
    return { error: loginRequiredMessage, ok: false, status: 401 };
  }

  const authClient = getSupabaseAuthClient();
  const serviceClient = getSupabaseServiceClient();

  if (!authClient || !serviceClient) {
    return { error: authConfigMissingMessage, ok: false, status: 503 };
  }

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);

  if (error || !user) {
    return { error: loginRequiredMessage, ok: false, status: 401 };
  }

  return { ok: true, user };
}

function getBearerToken(request) {
  const authorization = request.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function getSupabaseAuthClient() {
  if (supabaseAuthClient) return supabaseAuthClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  supabaseAuthClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return supabaseAuthClient;
}

function getSupabaseHost() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!supabaseUrl) return "";

  try {
    return new URL(supabaseUrl).host;
  } catch {
    return "invalid-url";
  }
}

function getSupabaseServiceClient() {
  if (supabaseServiceClient) return supabaseServiceClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  supabaseServiceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return supabaseServiceClient;
}

async function getQuotaForUser(userId) {
  const quota = await callQuotaRpc("get_agent_generation_usage", userId);
  return normalizeQuotaResponse(quota);
}

async function reserveQuotaForUser(userId) {
  const quota = await callQuotaRpc("reserve_agent_generation", userId);
  const normalizedQuota = normalizeQuotaResponse(quota);

  return {
    allowed: Boolean(firstRow(quota)?.allowed),
    quota: normalizedQuota,
  };
}

async function completeReservedQuotaForUser(userId) {
  const quota = await callQuotaRpc("complete_agent_generation", userId);
  return normalizeQuotaResponse(quota);
}

async function releaseReservedQuotaForUser(userId) {
  const quota = await callQuotaRpc("release_agent_generation", userId);
  return normalizeQuotaResponse(quota);
}

async function callQuotaRpc(functionName, userId) {
  const serviceClient = getSupabaseServiceClient();

  if (!serviceClient) {
    throw new Error("Supabase service role is required for generation quotas.");
  }

  const { data, error } = await serviceClient.rpc(functionName, {
    p_agent_slug: agentSlug,
    p_limit: generationQuotaLimit,
    p_usage_date: getLocalDateKey(),
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  return data;
}

function firstRow(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

function normalizeQuotaResponse(data) {
  const row = firstRow(data);
  const date = readString(row?.usage_date) || getLocalDateKey();
  const generationCount = Math.max(0, Number(row?.generation_count) || 0);
  const reservedCount = Math.max(0, Number(row?.reserved_count) || 0);
  const limit = Math.max(1, Number(row?.limit_count) || generationQuotaLimit);
  const remaining = Math.max(0, limit - generationCount - reservedCount);

  return {
    date,
    generationCount,
    limit,
    remaining,
  };
}

function normalizeDiagnosisInput(form, input) {
  const account = readRecord(form.account);
  const recognition = readRecord(form.recognition);
  const source = readRecord(input);
  const rawAccountName = readString(source.accountName) || readString(account.name);
  const inferredAccountId = readString(source.accountId) || readString(account.accountId) || extractAccountIdFromText(rawAccountName);
  const accountName = normalizeAccountNameValue(rawAccountName, inferredAccountId);
  const recentContentText = [
    readString(source.recentContentText),
    readString(recognition.rawText),
    recentContentsToText(form.recentContents),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    accountId: inferredAccountId,
    accountName: accountName || inferredAccountId,
    bio: readString(source.bio) || readString(account.intro),
    followers: readString(source.followers) || readString(account.followers),
    goal:
      readString(source.goal) ||
      readString(account.biggestProblem) ||
      readString(account.primaryGoal) ||
      readString(readRecord(form.monetization).businessResult),
    platform: readString(source.platform) || readString(account.platform) || inferPlatform(readString(source.profileUrl) || readString(recognition.accountUrl)),
    productOrService: readString(source.productOrService) || readString(account.productService),
    profileUrl: readString(source.profileUrl) || readString(recognition.accountUrl),
    recentContentText,
    targetAudience: readString(source.targetAudience) || readString(account.targetCustomer) || readString(account.primaryGoal),
  };
}

function extractAccountIdFromText(value) {
  const text = readString(value);
  if (!text) return "";

  const labeledMatch = text.match(
    /(?:小红书号|抖音号|快手号|视频号|B站\s*UID|B站UID|UID|账号\s*ID|平台号|ID)\s*[:：]?\s*([A-Za-z0-9._-]{2,})/i,
  );
  if (labeledMatch?.[1]) return labeledMatch[1].trim();

  if (/^[A-Za-z0-9._-]{5,}$/.test(text) && /[\d._-]/.test(text)) return text;
  return "";
}

function normalizeAccountNameValue(value, accountId = "") {
  const text = readString(value);
  if (!text) return "";

  const withoutLabel = text
    .replace(/^(?:小红书号|抖音号|快手号|视频号|B站\s*UID|B站UID|UID|账号\s*ID|平台号|ID)\s*[:：]?\s*/i, "")
    .trim();

  if (accountId && withoutLabel === accountId) return "";
  return withoutLabel || text;
}

function recentContentsToText(contents) {
  if (!Array.isArray(contents)) return "";

  return contents
    .map((item, index) => {
      const content = readRecord(item);
      const title = readString(content.title);
      const body = readString(content.body);
      const views = readString(content.views);
      const likes = readString(content.likes);
      const saves = readString(content.saves);
      const comments = readString(content.comments);
      const follows = readString(content.follows);

      if (!title && !body && !views) return "";

      return [
        `内容${index + 1}：${title || "未命名内容"}`,
        views ? `播放/阅读：${views}` : "",
        likes ? `点赞：${likes}` : "",
        saves ? `收藏：${saves}` : "",
        comments ? `评论：${comments}` : "",
        follows ? `涨粉：${follows}` : "",
        body ? `正文/脚本：${body}` : "",
      ]
        .filter(Boolean)
        .join("，");
    })
    .filter(Boolean)
    .join("\n");
}

function validateInput(form, diagnosisInput) {
  const account = readRecord(form.account);

  if (!readString(diagnosisInput.platform)) return "请选择平台。";
  if (!readString(diagnosisInput.accountName) && !readString(diagnosisInput.accountId)) {
    return "请填写账号名称或账号ID。";
  }
  if (!readString(diagnosisInput.goal)) {
    return "请补充当前最想解决的问题。";
  }
  if (!readString(diagnosisInput.targetAudience) && !readString(account.primaryGoal)) {
    return "请补充目标客户或账号目标。";
  }
  return "";
}

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function generateWithProvider({ diagnosisInput, focus, form, plan }) {
  const provider = (process.env.AI_PROVIDER || "moonshot").toLowerCase();
  const useMoonshot = provider === "moonshot" || (!provider && Boolean(process.env.MOONSHOT_API_KEY));
  const apiKey = useMoonshot ? process.env.MOONSHOT_API_KEY : process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

  if (!apiKey) {
    return buildDemoReport(form, diagnosisInput);
  }

  const baseUrl = (
    useMoonshot
      ? process.env.MOONSHOT_BASE_URL || "https://api.moonshot.cn/v1"
      : process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.AI_MODEL || (useMoonshot ? "moonshot-v1-8k" : process.env.OPENAI_MODEL || "gpt-4o-mini");
  const requestBody = {
    messages: [
      { content: systemPrompt, role: "system" },
      {
        content: [
          `当前版本：${plan}`,
          `本次重点：${focus}`,
          buildInputCompletenessNote(diagnosisInput),
          "标准化诊断输入 JSON：",
          JSON.stringify(diagnosisInput, null, 2),
          "完整补充表单 JSON：",
          JSON.stringify(form, null, 2),
          "请优先基于标准化诊断输入生成报告，不要依赖账号主页链接判断平台。链接仅作为辅助参考。如果数据不足，请明确哪些判断是基于现有信息推断。",
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

  let providerResponse;

  try {
    providerResponse = await fetch(`${baseUrl}/chat/completions`, {
      body: JSON.stringify(requestBody),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch (error) {
    console.error("moonshot_fetch_error", error);
    return buildDemoReport(form, diagnosisInput);
  }

  if (!providerResponse.ok) {
    const errorText = await providerResponse.text().catch(() => "");

    if (isProviderRateLimited(providerResponse.status, errorText)) {
      throw new ProviderRateLimitError();
    }

    console.error("moonshot_response_error", providerResponse.status, errorText.slice(0, 500));
    return buildDemoReport(form, diagnosisInput);
  }

  const result = await providerResponse.json().catch(() => null);
  const content = result?.choices?.[0]?.message?.content;
  return normalizeReport(extractJson(content), form, diagnosisInput);
}

function buildInputCompletenessNote(diagnosisInput) {
  if (readString(diagnosisInput.bio) && readString(diagnosisInput.recentContentText)) {
    return "用户已提供账号简介和近期内容数据，请结合这些信息做具体判断。";
  }

  return "由于用户没有提供主页简介和近期内容数据，报告必须说明：由于你没有提供主页简介和近期内容数据，本报告会基于平台、账号名和目标进行基础诊断。补充内容数据后可获得更精准分析。";
}

function isProviderRateLimited(status, errorText) {
  const normalized = String(errorText || "").toLowerCase();

  return (
    status === 429 ||
    normalized.includes("rate_limit") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  );
}

function extractJson(content) {
  if (isRecord(content)) return content;
  const text = typeof content === "string" ? content.trim() : "";

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return {};
      }
    }
    return {};
  }
}

function normalizeReport(raw, form, diagnosisInput = normalizeDiagnosisInput(form, {})) {
  const fallback = buildDemoReport(form, diagnosisInput);
  const scores = readRecord(raw.scores);
  const normalizedScores = {};

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

function buildDemoReport(form, diagnosisInput = normalizeDiagnosisInput(form, {})) {
  const account = readRecord(form.account);
  const platform = readString(diagnosisInput.platform) || readString(account.platform) || "主平台";
  const accountName = readString(diagnosisInput.accountName) || readString(diagnosisInput.accountId) || readString(account.name) || "当前账号";
  const field = readString(account.field) || "当前领域";
  const targetCustomer = readString(diagnosisInput.targetAudience) || readString(account.targetCustomer) || "目标用户";
  const product = readString(diagnosisInput.productOrService) || readString(account.productService) || "产品/服务";
  const goal = readString(diagnosisInput.goal) || readString(account.primaryGoal) || readString(account.biggestProblem) || "获客与转化";
  const isBasicDiagnosis = !readString(diagnosisInput.bio) && !readString(diagnosisInput.recentContentText);
  const basicDiagnosisNote = "由于你没有提供主页简介和近期内容数据，本报告会基于平台、账号名和目标进行基础诊断。补充内容数据后可获得更精准分析。";

  return {
    oneLineJudgement: `${isBasicDiagnosis ? `${basicDiagnosisNote} ` : ""}${accountName}适合先围绕“${field} + ${targetCustomer}”统一定位，再用连续 7 天内容测试提升${goal}效率。`,
    problemTags: [
      isBasicDiagnosis ? "基础信息诊断" : "识别信息待完善",
      "标题结果感不够强",
      "主页转化弱",
      "内容栏目需要稳定",
      "私域引导不足",
    ],
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
          why: "用户进入主页后需要立即判断是否值得关注和私信。",
          how: `围绕${targetCustomer}写一句明确承诺，并放入私域入口。`,
          expectedEffect: "提升关注率和私信率",
        },
        {
          item: "连续 7 天只测试 2-3 个核心痛点",
          why: "内容方向太散会降低平台和用户对账号的理解。",
          how: "每天发布一个痛点解决型内容，记录播放、收藏、评论和涨粉。",
          expectedEffect: "更快找到可复制选题",
        },
      ],
      competitorAnalysis: {
        差距: ["账号承接链路和栏目化表达还不够清晰。"],
        差异化打法: [`在${platform}强调真实经验、案例过程和可交付资料。`],
        爆款规律: ["标题包含明确结果、具体人群、低门槛动作。"],
      },
      contentStructure: {
        当前内容最大问题: "内容可能有价值，但栏目和转化动作不够稳定。",
        建议内容比例: [
          { 类型: "实用教程", 比例: "40%", 原因: "建立专业度" },
          { 类型: "案例拆解", 比例: "25%", 原因: "降低信任门槛" },
          { 类型: "痛点解决", 比例: "20%", 原因: "触发互动和收藏" },
          { 类型: "产品/服务转化", 比例: "10%", 原因: "承接商业目标" },
          { 类型: "个人信任内容", 比例: "5%", 原因: "建立真人信任" },
        ],
      },
      dataDiagnosis: {
        问题所在环节: "优先判断为点击、转粉和转化环节偏弱。",
        可能原因: ["标题没有足够结果感", "主页没有明确承接", "内容缺少系列化栏目"],
        下一步优化动作: ["统一每条内容结尾的评论/私信引导", "重点观察收藏率、评论率和转粉率"],
      },
      monetizationPath: {
        免费内容引流方式: ["评论关键词领取清单/模板", "私信发送诊断表"],
        私域承接路径: ["内容评论 -> 私信 -> 企微/微信 -> 需求判断 -> 低价产品 -> 高价服务"],
        低价产品设计: ["资料包、模板包、入门小课"],
        中价产品设计: [`围绕${product}设计训练营、陪跑或咨询服务`],
        高价服务设计: ["1v1 咨询、企业内训、长期陪跑"],
      },
      positioning: {
        当前账号像什么类型: `${platform}${field}知识/解决方案型账号`,
        信息完整度说明: isBasicDiagnosis ? basicDiagnosisNote : "已结合你提供的账号简介或近期内容数据进行诊断。",
        定位是否清晰: "基于现有信息判断：有方向，但表达还可以更锋利。",
        当前定位最大问题: "账号价值点还需要更具体地绑定目标客户和商业结果。",
        建议定位方向: `${targetCustomer}的${field}增长/提效顾问`,
        一句话定位: `我帮助${targetCustomer}用${field}方法解决增长、效率或转化问题。`,
        适合的人设标签: ["实战型", "案例拆解型", "工具型", "陪跑顾问型"],
      },
      privateTrafficScripts: {
        私信第一句话: ["看到你想要资料了，我先问两个问题，方便给你更匹配的版本。"],
        判断客户需求的问题: ["你现在最想解决的是涨粉、获客还是成交？", "你现在有什么产品/服务在卖？"],
        引导进入微信或企微的话术: ["我拉你进实操群，里面会发案例拆解和模板，适合边看边改。"],
        引导购买低价产品的话术: [`我整理了一份适合${targetCustomer}的入门资料包，可以先用它把第一步跑起来。`],
      },
      profileConversion: {
        昵称建议: `${readString(account.name) || `${field}增长顾问`}｜${field}增长`,
        优化后的主页简介: `${field}增长顾问｜帮助${targetCustomer}解决内容增长和转化问题｜评论/私信领取诊断清单`,
        简介问题: ["服务对象不够具体", "缺少可复制的领取/咨询入口"],
        私域入口建议: ["评论关键词", "私信自动回复", "主页置顶领取入口"],
        置顶内容建议: ["账号介绍", "爆款教程", "客户案例", "产品/服务说明"],
      },
      sevenDayPlan: Array.from({ length: 7 }, (_, index) => ({
        任务: `Day ${index + 1}`,
        目标: index === 0 ? "提升主页承接" : "测试选题和标题",
        具体内容:
          index === 0 ? "重写主页简介和置顶内容结构" : `发布 1 条${field}痛点解决内容`,
        输出物: index === 0 ? "新版主页简介 + 置顶选题" : "1 条内容 + 数据记录",
      })),
      thirtyDayPlan: [
        { 周: "第1周", 主题: "账号定位强化", 任务: "统一主页、栏目和目标用户表达" },
        { 周: "第2周", 主题: "痛点内容测试", 任务: `围绕${targetCustomer}测试 10 个痛点` },
        { 周: "第3周", 主题: "案例和信任建设", 任务: "发布案例拆解、过程记录和用户反馈" },
        { 周: "第4周", 主题: "转化内容布局", 任务: "安排产品说明、私域引导和成交话术内容" },
      ],
      titleCover: {
        当前标题主要问题: ["结果感不够强", "没有明确目标人群", "缺少具体场景"],
        标题优化原则: ["人群具体", "结果明确", "动作简单", "数字化表达"],
        可直接使用的优化标题: [
          `我用${field}解决了一个最常见的增长问题`,
          `${targetCustomer}最容易踩的 3 个内容坑`,
          `别再这样做${platform}了，难怪不转化`,
          "7 天把账号主页改成能获客的样子",
          "这类内容收藏高但不成交，原因在这里",
          `从 0 到 1 做${field}账号，先改这 5 个地方`,
          "一个标题模板，让内容更有结果感",
          `${targetCustomer}可以直接照着做的内容清单`,
          "账号不涨粉，通常不是因为你不努力",
          "把主页这句话改掉，私信率会更高",
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
      },
      userPersona: {
        当前可能吸引的人群: [targetCustomer, "对该领域感兴趣但付费意愿不明的人群"],
        最值得服务的人群: targetCustomer,
        目标用户核心痛点: ["缺方法", "缺案例", "缺执行路径", "缺转化话术"],
        后续内容痛点方向: ["不知道发什么", "内容有流量但没咨询", "主页承接弱", "私域转化不自然"],
      },
      viralOpportunities: [
        {
          方向: "痛点避坑",
          理由: "低门槛、容易触发收藏和评论。",
          标题: [`${targetCustomer}别再这样做账号了`, "不涨粉常见的 5 个坑", "这一步没做，内容很难转化"],
        },
        {
          方向: "模板清单",
          理由: "适合承接私域领取。",
          标题: ["7天内容计划模板", "主页简介可复制模板", "私信转化话术清单"],
        },
        {
          方向: "案例拆解",
          理由: "建立专业信任。",
          标题: ["一个账号改版前后对比", "我如何判断账号不成交的原因", "3个主页转化案例"],
        },
        {
          方向: "新手路径",
          理由: "覆盖入门用户。",
          标题: ["新手第一周只做这几件事", "从0开始做账号的顺序", "别一上来就追热点"],
        },
        {
          方向: "成交链路",
          理由: "直接服务商业结果。",
          标题: ["有流量没成交怎么办", "内容到私域的承接链路", "低价产品如何自然引导"],
        },
      ],
    },
    title: "《新媒体账号增长诊断报告》",
  };
}

function inferPlatform(url) {
  if (!url) return "";
  if (/xiaohongshu|xhslink/i.test(url)) return "小红书";
  if (/douyin|iesdouyin/i.test(url)) return "抖音";
  if (/bilibili|b23\.tv/i.test(url)) return "B站";
  if (/kuaishou/i.test(url)) return "快手";
  if (/weixin|qq\.com/i.test(url)) return "微信生态";
  if (/weibo/i.test(url)) return "微博";
  return "";
}

function clampScore(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function readRecord(value) {
  return isRecord(value) ? value : {};
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => readString(item)).filter(Boolean);
}
