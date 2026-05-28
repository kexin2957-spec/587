import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  buildAccountProfileUrlCandidates,
  mergeAccountParserResult,
  parseAccountInput,
  type AccountParserResult,
} from "@/lib/tools/account-parser";
import { logApiError } from "@/lib/server/monitoring";
import { enforceRateLimit, rateLimits } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ParseAccountRequest = {
  accountId?: string;
  accountName?: string;
  accountUrl?: string;
  input?: string;
  platform?: string;
  rawText?: string;
};

type PublicPageSnapshot = {
  description: string;
  text: string;
  title: string;
};

type PublicPageCrawlResult = {
  snapshot: PublicPageSnapshot;
  url: string;
};

export async function POST(request: Request) {
  const rateLimitResponse = enforceRateLimit(request, rateLimits.chat);

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let localResult: AccountParserResult | null = null;

  try {
    const payload = (await request.json()) as ParseAccountRequest;
    const input = buildInput(payload);
    localResult = mergeAccountParserResult(parseAccountInput(input), buildPayloadExtraction(payload));
    const pageCrawl = await fetchPublicPageSnapshot(localResult, payload);
    const pageSnapshot = pageCrawl?.snapshot ?? null;
    const parserWithPage = pageSnapshot
      ? mergeAccountParserResult(
          mergeAccountParserResult(localResult, parseAccountInput(pageCrawl?.url ?? "")),
          buildPageExtraction(pageSnapshot, localResult),
        )
      : withCrawlWarning(localResult);
    const aiInput = buildAiInput(input, pageSnapshot);
    const aiResult = await extractWithProvider(aiInput, parserWithPage);

    return NextResponse.json({
      ok: true,
      parser: aiResult ? mergeAccountParserResult(parserWithPage, aiResult) : parserWithPage,
      crawledUrl: pageCrawl?.url ?? "",
      usedCrawler: Boolean(pageSnapshot),
      usedAi: Boolean(aiResult),
    });
  } catch (error) {
    logApiError("media_account_parse_error", error, {
      path: new URL(request.url).pathname,
    });

    return NextResponse.json({
      ok: true,
      parser: localResult ?? parseAccountInput(""),
      usedAi: false,
    });
  }
}

function buildInput(payload: ParseAccountRequest) {
  if (typeof payload.input === "string" && payload.input.trim()) {
    return payload.input;
  }

  return [
    payload.platform ? `平台：${payload.platform}` : "",
    payload.accountName ? `账号名称：${payload.accountName}` : "",
    payload.accountId ? `账号ID：${payload.accountId}` : "",
    payload.accountUrl,
    payload.rawText,
  ]
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .join("\n");
}

function buildPayloadExtraction(payload: ParseAccountRequest) {
  return {
    accountId: payload.accountId,
    accountName: payload.accountName,
    platform: payload.platform,
  };
}

async function extractWithProvider(input: string, localResult: AccountParserResult) {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  const useMoonshot = provider === "moonshot" || (!provider && Boolean(process.env.MOONSHOT_API_KEY));
  const apiKey = useMoonshot ? process.env.MOONSHOT_API_KEY : process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

  if (!apiKey || !shouldUseAi(input, localResult)) {
    return null;
  }

  const baseUrl = (
    useMoonshot
      ? process.env.MOONSHOT_BASE_URL || "https://api.moonshot.cn/v1"
      : process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.AI_MODEL || (useMoonshot ? "moonshot-v1-8k" : process.env.OPENAI_MODEL || "gpt-4o-mini");
  const requestBody: Record<string, unknown> = {
    messages: [
      {
        content:
          "你是账号主页信息解析器。只从用户粘贴的文本里提取结构化字段，不要承诺抓取平台数据，不要推测不存在的数据。只输出合法 JSON。",
        role: "system",
      },
      {
        content: [
          "请从下面的账号链接或账号主页复制文本中提取信息。",
          "返回字段：accountName, accountId, bio, followers, avgViews, inferredField, contentStyle, targetUsers, recentPosts。",
          "recentPosts 是数组，每项包含 title、views、likes、saves、comments、follows。没有明确数据就返回空字符串或空数组。",
          "可以基于文本轻度推断 inferredField、contentStyle、targetUsers，但不要编造粉丝数、播放量等数据。",
          "如果能从文本判断平台，也可返回 platform，可选值：xiaohongshu、douyin、bilibili、kuaishou、wechat_channels、wechat_official、weibo、unknown。",
          "",
          "用户输入：",
          input,
        ].join("\n"),
        role: "user",
      },
    ],
    model,
    response_format: { type: "json_object" },
    temperature: 0,
  };

  if (process.env.AI_DISABLE_RESPONSE_FORMAT === "true") {
    delete requestBody.response_format;
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      body: JSON.stringify(requestBody),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      return null;
    }

    const result = (await response.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: string } }>;
    } | null;

    return extractJson(result?.choices?.[0]?.message?.content);
  } catch {
    return null;
  }
}

function shouldUseAi(input: string, localResult: AccountParserResult) {
  if (!input.trim()) return false;
  if (localResult.inputType === "text" || localResult.inputType === "mixed") return true;
  return input.trim().length >= 20 && !localResult.isShortLink;
}

function buildAiInput(input: string, pageSnapshot: PublicPageSnapshot | null) {
  if (!pageSnapshot) return input;

  return [
    input,
    "",
    "轻量公开页面信息（仅来自 title、meta、OG 和页面可见文本片段，不代表已抓取平台完整数据）：",
    `title: ${pageSnapshot.title}`,
    `description: ${pageSnapshot.description}`,
    `text: ${pageSnapshot.text.slice(0, 5000)}`,
  ].join("\n");
}

async function fetchPublicPageSnapshot(
  result: AccountParserResult,
  payload: ParseAccountRequest,
): Promise<PublicPageCrawlResult | null> {
  const candidateUrls = dedupeStrings([
    result.normalizedUrl && !result.isShortLink && result.linkType !== "unknown" ? result.normalizedUrl : "",
    ...buildAccountProfileUrlCandidates({
      accountId: result.accountId || payload.accountId,
      accountName: result.accountName || payload.accountName,
      platform: result.platform,
      platformLabel: result.platformLabel || payload.platform,
    }),
  ]).slice(0, 3);

  for (const candidateUrl of candidateUrls) {
    const snapshot = await fetchSinglePublicPageSnapshot(candidateUrl);
    if (snapshot) {
      return { snapshot, url: candidateUrl };
    }
  }

  return null;
}

async function fetchSinglePublicPageSnapshot(candidateUrl: string): Promise<PublicPageSnapshot | null> {
  let url: URL;
  try {
    url = new URL(candidateUrl);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(url.protocol)) return null;
  if (!(await isPublicHostname(url.hostname))) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.6",
        Referer: "https://www.baidu.com/",
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) return null;

    const html = (await response.text()).slice(0, 120_000);
    return extractPublicPageSnapshot(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function isPublicHostname(hostname: string) {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return false;
  }

  if (isPrivateIp(host)) return false;

  try {
    const records = await lookup(host, { all: true, verbatim: true });
    return records.length > 0 && records.every((record) => !isPrivateIp(record.address));
  } catch {
    return false;
  }
}

function isPrivateIp(value: string) {
  if (!isIP(value)) return false;
  if (value.includes(":")) {
    const text = value.toLowerCase();
    return text === "::1" || text.startsWith("fc") || text.startsWith("fd") || text.startsWith("fe80:");
  }

  const parts = value.split(".").map(Number);
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function extractPublicPageSnapshot(html: string): PublicPageSnapshot {
  const cleanHtml = html.replace(/\u0000/g, "");
  const title =
    readMeta(cleanHtml, "property", "og:title") ||
    readMeta(cleanHtml, "name", "twitter:title") ||
    readTag(cleanHtml, "title");
  const description =
    readMeta(cleanHtml, "name", "description") ||
    readMeta(cleanHtml, "property", "og:description") ||
    readMeta(cleanHtml, "name", "twitter:description");
  const text = decodeHtmlEntities(
    cleanHtml
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  ).slice(0, 8000);

  return {
    description: decodeHtmlEntities(description).slice(0, 500),
    text,
    title: decodeHtmlEntities(title).slice(0, 160),
  };
}

function buildPageExtraction(snapshot: PublicPageSnapshot, result: AccountParserResult) {
  const parsedFromPage = parseAccountInput([snapshot.title, snapshot.description, snapshot.text].join("\n"));
  const pageTitle = cleanupPageTitle(snapshot.title);
  const accountName = normalizePageAccountName(pageTitle, result);
  const bio = normalizePageBio(parsedFromPage.bio || snapshot.description, result);
  const recentPosts =
    parsedFromPage.recentPosts.length && !isGenericPlatformTitle(pageTitle, result)
      ? parsedFromPage.recentPosts
      : result.linkType === "content" && pageTitle && !isGenericPlatformTitle(pageTitle, result)
        ? [{ title: pageTitle }]
        : [];
  const warnings =
    !accountName && !bio && !parsedFromPage.followers && !parsedFromPage.avgViews && !recentPosts.length
      ? ["公开主页只返回了平台壳页面，无法读取账号详情。请补充主页链接、账号简介、粉丝数或近期内容。"]
      : [];

  return {
    accountName: result.linkType === "profile" ? accountName : "",
    avgViews: parsedFromPage.avgViews,
    bio,
    contentStyle: parsedFromPage.contentStyle,
    followers: parsedFromPage.followers,
    inferredField: parsedFromPage.inferredField,
    pageDescription: snapshot.description,
    pageTitle: snapshot.title,
    recentPosts,
    targetUsers: parsedFromPage.targetUsers,
    warnings,
  };
}

function withCrawlWarning(result: AccountParserResult): AccountParserResult {
  if (!result.normalizedUrl || result.isShortLink || result.linkType === "unknown") return result;
  return {
    ...result,
    warnings: dedupeStrings([
      ...result.warnings,
      "公开页面信息读取失败或不可访问，请手动补充账号简介、粉丝数和近期内容。",
    ]),
  };
}

function cleanupPageTitle(value: string) {
  return value
    .replace(/\s*[-_|｜]\s*(小红书|抖音|快手|哔哩哔哩|bilibili|微博|微信公众平台|微信).*$/i, "")
    .trim();
}

function normalizePageAccountName(value: string, result: AccountParserResult) {
  if (!value || isGenericPlatformTitle(value, result)) return "";
  if (/^(登录|注册|首页|发现|推荐)$/.test(value)) return "";
  return value.slice(0, 80);
}

function normalizePageBio(value: string, result: AccountParserResult) {
  const text = value.trim();
  if (!text || isGenericPlatformTitle(text, result)) return "";
  if (/^账号\s*ID\s*[:：]/i.test(text)) return "";
  if (result.accountId && text === result.accountId) return "";
  if (/^(登录|注册|下载|打开 App|扫码登录)/i.test(text)) return "";
  return text.slice(0, 300);
}

function isGenericPlatformTitle(value: string, result: AccountParserResult) {
  const text = value.trim().toLowerCase();
  const label = result.platformLabel.trim().toLowerCase();
  return Boolean(
    !text ||
      text === label ||
      text === result.platform ||
      /^(小红书|抖音|快手|微博|微信|视频号|公众号|bilibili|哔哩哔哩|b站)$/.test(text),
  );
}

function readTag(html: string, tag: string) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function readMeta(html: string, attrName: string, attrValue: string) {
  const tagMatch = html.match(new RegExp(`<meta[^>]+${attrName}=["']${escapeRegExp(attrValue)}["'][^>]*>`, "i"));
  const tag = tagMatch?.[0] ?? "";
  const content = tag.match(/\scontent=["']([^"']*)["']/i)?.[1] ?? "";
  return content.trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function dedupeStrings(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractJson(content: unknown) {
  const text = typeof content === "string" ? content.trim() : "";

  if (!text) return null;

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }

    return null;
  }
}
