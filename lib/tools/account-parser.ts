export type AccountInputType = "url" | "text" | "mixed" | "unknown";
export type AccountLinkType = "profile" | "content" | "short" | "webpage" | "unknown";

export type AccountPlatform =
  | "xiaohongshu"
  | "douyin"
  | "bilibili"
  | "kuaishou"
  | "wechat_channels"
  | "wechat_official"
  | "weibo"
  | "unknown";

export type ParsedRecentPost = {
  comments?: string;
  follows?: string;
  likes?: string;
  saves?: string;
  title: string;
  views?: string;
};

export type AccountParserResult = {
  accountId: string;
  accountName: string;
  avgViews: string;
  bio: string;
  confidence: number;
  contentStyle: string;
  followers: string;
  inferredField: string;
  inputType: AccountInputType;
  isShortLink: boolean;
  isValidProfileUrl: boolean;
  linkType: AccountLinkType;
  linkTypeLabel: string;
  normalizedUrl: string;
  pageDescription: string;
  pageTitle: string;
  platform: AccountPlatform;
  platformLabel: string;
  rawUrl: string;
  recentPosts: ParsedRecentPost[];
  targetUsers: string[];
  warnings: string[];
};

export type AccountProfileUrlCandidateInput = {
  accountId?: string;
  accountName?: string;
  platform?: AccountPlatform | string;
  platformLabel?: string;
};

type PlatformConfig = {
  domains: string[];
  label: string;
  platform: AccountPlatform;
  shortDomains?: string[];
};

const platformConfigs: PlatformConfig[] = [
  {
    domains: ["xiaohongshu.com", "xhslink.com"],
    label: "小红书",
    platform: "xiaohongshu",
    shortDomains: ["xhslink.com"],
  },
  {
    domains: ["douyin.com", "v.douyin.com", "iesdouyin.com"],
    label: "抖音",
    platform: "douyin",
    shortDomains: ["v.douyin.com"],
  },
  {
    domains: ["bilibili.com", "b23.tv"],
    label: "B站",
    platform: "bilibili",
    shortDomains: ["b23.tv"],
  },
  {
    domains: ["kuaishou.com", "v.kuaishou.com"],
    label: "快手",
    platform: "kuaishou",
    shortDomains: ["v.kuaishou.com"],
  },
  {
    domains: ["mp.weixin.qq.com"],
    label: "公众号",
    platform: "wechat_official",
  },
  {
    domains: ["channels.weixin.qq.com", "weixin.qq.com"],
    label: "视频号/微信",
    platform: "wechat_channels",
  },
  {
    domains: ["weibo.com"],
    label: "微博",
    platform: "weibo",
  },
];

const supportedDomains = platformConfigs.flatMap((item) => item.domains);

export function parseAccountInput(input: string): AccountParserResult {
  const rawInput = input.trim();
  const urls = extractCandidateUrls(rawInput);
  const primaryUrl = urls[0] ?? "";
  const normalizedUrl = normalizeUrl(primaryUrl);
  const urlInfo = parseUrlInfo(normalizedUrl);
  const textWithoutUrls = stripUrls(rawInput, urls);
  const inputType = inferInputType(rawInput, urls, textWithoutUrls);
  const textForExtraction = inputType === "url" ? "" : textWithoutUrls || rawInput;
  const textFields = parseAccountText(textForExtraction);
  const warnings: string[] = [];

  if (!rawInput) {
    warnings.push("请输入账号链接、主页复制文本或账号昵称。");
  }

  if (primaryUrl && urlInfo.platform === "unknown") {
    warnings.push("暂时无法识别该链接，请手动选择平台。");
  }

  if (urlInfo.isShortLink) {
    warnings.push("已识别为短链接，只能判断平台，无法展开读取账号详情。");
  }

  if (urlInfo.linkType === "content") {
    warnings.push("已识别为单条内容链接，账号详细信息可能需要手动补充。");
  }

  const hasAccountDetails = Boolean(
    textFields.accountName ||
      textFields.accountId ||
      textFields.bio ||
      textFields.followers ||
      textFields.avgViews ||
      textFields.recentPosts.length,
  );

  if (urlInfo.platform !== "unknown" && !hasAccountDetails) {
    warnings.push("已识别平台，但无法读取账号详细信息，请补充账号简介、粉丝数和近期内容。");
  }

  return {
    accountId: textFields.accountId || urlInfo.accountId,
    accountName: textFields.accountName,
    avgViews: textFields.avgViews,
    bio: textFields.bio,
    confidence: getConfidence({
      hasAccountDetails,
      inputType,
      isShortLink: urlInfo.isShortLink,
      isValidProfileUrl: urlInfo.isValidProfileUrl,
      platform: urlInfo.platform,
    }),
    contentStyle: textFields.contentStyle,
    followers: textFields.followers,
    inferredField: textFields.inferredField,
    inputType,
    isShortLink: urlInfo.isShortLink,
    isValidProfileUrl: urlInfo.isValidProfileUrl,
    linkType: urlInfo.linkType,
    linkTypeLabel: getLinkTypeLabel(urlInfo.linkType),
    normalizedUrl,
    pageDescription: "",
    pageTitle: "",
    platform: urlInfo.platform,
    platformLabel: urlInfo.platformLabel,
    rawUrl: primaryUrl,
    recentPosts: textFields.recentPosts,
    targetUsers: textFields.targetUsers,
    warnings: dedupeStrings(warnings),
  };
}

export function mergeAccountParserResult(
  base: AccountParserResult,
  aiValue: unknown,
): AccountParserResult {
  const ai = isRecord(aiValue) ? aiValue : {};
  const aiPosts = normalizeRecentPosts(ai.recentPosts);
  const aiLinkType = toLinkType(readString(ai.linkType));
  const aiAccountId = readString(ai.accountId) || base.accountId;
  const aiBio = normalizeExtractedBio(readString(ai.bio), aiAccountId);
  const next: AccountParserResult = {
    ...base,
    accountId: aiAccountId,
    accountName: readString(ai.accountName) || base.accountName,
    avgViews: readString(ai.avgViews) || base.avgViews,
    bio: aiBio || base.bio,
    contentStyle: readString(ai.contentStyle) || base.contentStyle,
    followers: readString(ai.followers) || base.followers,
    inferredField: readString(ai.inferredField) || base.inferredField,
    inputType: toInputType(readString(ai.inputType)) || base.inputType,
    isShortLink: typeof ai.isShortLink === "boolean" ? ai.isShortLink : base.isShortLink,
    isValidProfileUrl: typeof ai.isValidProfileUrl === "boolean" ? ai.isValidProfileUrl : base.isValidProfileUrl,
    linkType: aiLinkType || base.linkType,
    linkTypeLabel: aiLinkType ? getLinkTypeLabel(aiLinkType) : base.linkTypeLabel,
    normalizedUrl: readString(ai.normalizedUrl) || base.normalizedUrl,
    pageDescription: readString(ai.pageDescription) || base.pageDescription,
    pageTitle: readString(ai.pageTitle) || base.pageTitle,
    rawUrl: readString(ai.rawUrl) || base.rawUrl,
    recentPosts: aiPosts.length ? aiPosts : base.recentPosts,
    targetUsers: readStringArray(ai.targetUsers).length ? readStringArray(ai.targetUsers).slice(0, 6) : base.targetUsers,
  };

  if (base.platform === "unknown") {
    const platform = toPlatform(readString(ai.platform));
    if (platform !== "unknown") {
      next.platform = platform;
      next.platformLabel = getPlatformLabel(platform);
    } else if (readString(ai.platformLabel)) {
      next.platformLabel = readString(ai.platformLabel);
    }
  }

  const hasMoreData =
    next.accountName !== base.accountName ||
    next.bio !== base.bio ||
    next.followers !== base.followers ||
    next.avgViews !== base.avgViews ||
    next.recentPosts.length !== base.recentPosts.length;

  next.confidence = Math.min(1, Number((base.confidence + (hasMoreData ? 0.12 : 0)).toFixed(2)));
  next.warnings = dedupeStrings([...getWarningsForResult(next), ...readStringArray(ai.warnings)]);
  return next;
}

function toInputType(value: string): AccountInputType | "" {
  return value === "url" || value === "text" || value === "mixed" || value === "unknown" ? value : "";
}

function toLinkType(value: string): AccountLinkType | "" {
  return value === "profile" || value === "content" || value === "short" || value === "webpage" || value === "unknown"
    ? value
    : "";
}

function normalizeExtractedBio(value: string, accountId = "") {
  const text = value.trim();
  if (!text) return "";
  if (/^账号\s*ID\s*[:：]/i.test(text)) return "";
  if (/^平台账号\s*ID\s*[:：]/i.test(text)) return "";
  if (accountId && text === accountId) return "";
  return text;
}

export function buildAccountProfileUrlCandidates(input: AccountProfileUrlCandidateInput) {
  const platform = toPlatform(`${input.platform ?? ""} ${input.platformLabel ?? ""}`);
  const accountId = sanitizeAccountIdentifier(input.accountId ?? "");
  const accountName = sanitizeAccountIdentifier(input.accountName ?? "");
  const primaryIdentifier = accountId || accountName;

  if (!primaryIdentifier) return [];

  const encoded = encodeURIComponent(primaryIdentifier);
  const urls: string[] = [];

  if (platform === "xiaohongshu") {
    urls.push(`https://www.xiaohongshu.com/user/profile/${encoded}`);
  }
  if (platform === "douyin") {
    urls.push(`https://www.douyin.com/user/${encoded}`);
  }
  if (platform === "bilibili") {
    urls.push(`https://space.bilibili.com/${encoded}`);
  }
  if (platform === "kuaishou") {
    urls.push(`https://www.kuaishou.com/profile/${encoded}`);
  }
  if (platform === "weibo") {
    if (/^\d+$/.test(primaryIdentifier)) {
      urls.push(`https://weibo.com/u/${encoded}`);
    } else {
      urls.push(`https://weibo.com/n/${encoded}`);
    }
  }

  return dedupeStrings(urls);
}

function sanitizeAccountIdentifier(value: string) {
  const text = value.trim().replace(/^@/, "");
  if (!text || text.length > 80) return "";
  if (/^https?:\/\//i.test(text)) return "";
  return text;
}

function parseUrlInfo(normalizedUrl: string) {
  if (!normalizedUrl) {
    return {
      accountId: "",
      isShortLink: false,
      isValidProfileUrl: false,
      linkType: "unknown" as AccountLinkType,
      platform: "unknown" as AccountPlatform,
      platformLabel: "未知平台",
    };
  }

  try {
    const parsed = new URL(normalizedUrl);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;
    const config = platformConfigs.find((item) =>
      item.domains.some((domain) => hostMatches(hostname, domain)),
    );
    const platform = config?.platform ?? "unknown";
    const accountId = extractAccountId(platform, hostname, pathname, parsed.searchParams);
    const isShortLink = Boolean(config?.shortDomains?.some((domain) => hostMatches(hostname, domain)));
    const linkType = inferLinkType(platform, hostname, pathname, parsed.searchParams, Boolean(accountId), isShortLink);

    return {
      accountId,
      isShortLink,
      isValidProfileUrl: linkType === "profile",
      linkType,
      platform,
      platformLabel: config?.label ?? "未知平台",
    };
  } catch {
    return {
      accountId: "",
      isShortLink: false,
      isValidProfileUrl: false,
      linkType: "unknown" as AccountLinkType,
      platform: "unknown" as AccountPlatform,
      platformLabel: "未知平台",
    };
  }
}

function inferLinkType(
  platform: AccountPlatform,
  hostname: string,
  pathname: string,
  searchParams: URLSearchParams,
  hasAccountId: boolean,
  isShortLink: boolean,
): AccountLinkType {
  if (isShortLink) return "short";
  if (platform === "unknown") return "webpage";

  const cleanPath = decodeURIComponent(pathname).toLowerCase();
  if (platform === "xiaohongshu") {
    if (/\/user\/profile\//.test(cleanPath)) return "profile";
    if (/\/explore\/|\/discovery\/item\//.test(cleanPath)) return "content";
  }
  if (platform === "douyin") {
    if (/\/user\/|\/share\/user\//.test(cleanPath)) return "profile";
    if (/\/video\/|\/note\/|\/share\/video\//.test(cleanPath)) return "content";
  }
  if (platform === "bilibili") {
    if (hostMatches(hostname, "space.bilibili.com") || /\/space\//.test(cleanPath)) return "profile";
    if (/\/video\/|\/read\/|\/opus\//.test(cleanPath)) return "content";
  }
  if (platform === "kuaishou") {
    if (/\/profile\/|\/user\//.test(cleanPath)) return "profile";
    if (/\/short-video\/|\/photo\/|\/fw\/photo\//.test(cleanPath)) return "content";
  }
  if (platform === "wechat_official") {
    if (hostMatches(hostname, "mp.weixin.qq.com") && cleanPath.startsWith("/s")) return "content";
  }
  if (platform === "wechat_channels") {
    if (/\/profile\//.test(cleanPath)) return "profile";
    if (/\/s\/|\/video\//.test(cleanPath)) return "content";
  }
  if (platform === "weibo") {
    if (/^\/u\/|^\/n\//.test(cleanPath)) return "profile";
    if (/\/status\/|\/detail\//.test(cleanPath)) return "content";
    if (hasAccountId && cleanPath.split("/").filter(Boolean).length === 1) return "profile";
  }

  return hasAccountId ? "profile" : "webpage";
}

function extractAccountId(
  platform: AccountPlatform,
  hostname: string,
  pathname: string,
  searchParams: URLSearchParams,
) {
  const cleanPath = decodeURIComponent(pathname);
  if (platform === "xiaohongshu") {
    return cleanPath.match(/\/user\/profile\/([^/?#]+)/i)?.[1] ?? "";
  }
  if (platform === "douyin") {
    return (
      cleanPath.match(/\/user\/([^/?#]+)/i)?.[1] ??
      cleanPath.match(/\/share\/user\/([^/?#]+)/i)?.[1] ??
      ""
    );
  }
  if (platform === "bilibili") {
    if (hostMatches(hostname, "space.bilibili.com")) {
      return cleanPath.match(/^\/([^/?#]+)/)?.[1] ?? "";
    }
    return cleanPath.match(/\/space\/([^/?#]+)/i)?.[1] ?? "";
  }
  if (platform === "kuaishou") {
    return (
      cleanPath.match(/\/profile\/([^/?#]+)/i)?.[1] ??
      cleanPath.match(/\/user\/([^/?#]+)/i)?.[1] ??
      ""
    );
  }
  if (platform === "wechat_official") {
    return searchParams.get("__biz") ?? "";
  }
  if (platform === "wechat_channels") {
    return cleanPath.match(/\/profile\/([^/?#]+)/i)?.[1] ?? "";
  }
  if (platform === "weibo") {
    return (
      cleanPath.match(/^\/u\/([^/?#]+)/i)?.[1] ??
      cleanPath.match(/^\/n\/([^/?#]+)/i)?.[1] ??
      cleanPath.match(/^\/([^/?#]+)$/)?.[1] ??
      ""
    );
  }
  return "";
}

function parseAccountText(text: string) {
  const trimmed = text.trim();
  const recentPosts = parseRecentPosts(trimmed);
  const fallbackName =
    !extractCandidateUrls(trimmed).length && isLikelyNickname(trimmed) ? trimmed.replace(/^@/, "") : "";

  return {
    accountId: pickAccountId(trimmed),
    accountName:
      pickByLabels(trimmed, [
        "账号名称",
        "账号名",
        "昵称",
        "主页名称",
        "博主",
        "UP主",
        "作者",
        "名称",
        "name",
      ]) || fallbackName,
    avgViews: pickNumber(trimmed, [
      "平均播放量",
      "平均播放",
      "平均阅读量",
      "平均阅读",
      "平均浏览",
      "播放量",
      "阅读量",
      "views",
    ]),
    bio: pickIntro(trimmed),
    contentStyle: inferContentStyle(trimmed),
    followers: pickNumber(trimmed, ["粉丝数", "粉丝", "关注者", "followers"]),
    inferredField: inferFieldFromText(trimmed),
    recentPosts,
    targetUsers: inferTargetUsers(trimmed),
  };
}

function pickAccountId(text: string) {
  return (
    pickByLabels(text, [
      "小红书号",
      "小红书ID",
      "小红书 ID",
      "小红书账号ID",
      "小红书账号",
      "抖音号",
      "抖音ID",
      "抖音 ID",
      "抖音账号ID",
      "抖音账号",
      "快手号",
      "快手ID",
      "快手 ID",
      "快手账号ID",
      "快手账号",
      "视频号ID",
      "视频号 ID",
      "视频号",
      "B站UID",
      "B站 UID",
      "B站ID",
      "B站 ID",
      "哔哩哔哩UID",
      "哔哩哔哩 UID",
      "公众号ID",
      "公众号 ID",
      "公众号原始ID",
      "微信号",
      "平台号",
      "账号ID",
      "用户ID",
      "UID",
      "ID",
    ]) || extractLooseAccountId(text)
  );
}

function extractLooseAccountId(text: string) {
  const match = text.match(
    /(?:小红书号|小红书\s*ID|抖音号|抖音\s*ID|快手号|快手\s*ID|视频号\s*ID|B站\s*UID|B站\s*ID|UID|账号\s*ID|用户\s*ID|平台号|ID)\s*[:：=]?\s*([A-Za-z0-9._-]{2,})/i,
  );
  if (match?.[1]) return match[1].trim();

  const atMatch = text.match(/@([A-Za-z0-9._-]{3,})/);
  return atMatch?.[1] ?? "";
}

function parseRecentPosts(text: string): ParsedRecentPost[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const candidates = lines
    .filter(
      (line) =>
        /(标题|内容|笔记|视频|作品|动态|播放|阅读|浏览|点赞|收藏|评论)/i.test(line) &&
        !/^(平均播放量?|平均阅读量?|平均浏览量?|粉丝数?|账号名称|账号名|昵称|简介|主页简介)[:：\s]/.test(line),
    )
    .slice(0, 12);

  return candidates
    .map((line) => {
      const title = cleanupTitle(line);
      return {
        comments: pickNumber(line, ["评论"]),
        follows: pickNumber(line, ["涨粉", "新增粉丝"]),
        likes: pickNumber(line, ["点赞", "赞"]),
        saves: pickNumber(line, ["收藏"]),
        title,
        views: pickNumber(line, ["播放", "阅读", "浏览", "观看"]),
      };
    })
    .filter((item) => item.title)
    .slice(0, 10);
}

function cleanupTitle(line: string) {
  const quoted = line.match(/[《「“"]([^》」”"]{4,90})[》」”"]/);
  if (quoted?.[1]) return quoted[1].trim();

  return line
    .replace(/^\d+[.、)]\s*/, "")
    .replace(/^(标题|内容|笔记|视频|作品|动态)\s*[:：]\s*/i, "")
    .replace(/(播放|阅读|浏览|观看|点赞|赞|收藏|评论|转发)\s*[:：]?\s*[\d.]+\s*(?:万|w|W|k|K|千|亿)?/g, "")
    .replace(/[，,；;｜|]\s*$/g, "")
    .trim()
    .slice(0, 90);
}

function inferFieldFromText(text: string) {
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
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? "";
}

function inferContentStyle(text: string) {
  const rules: Array<[string, RegExp]> = [
    ["教程型", /教程|方法|步骤|指南|清单|模板|攻略/],
    ["案例拆解型", /案例|拆解|复盘|前后对比|实操/],
    ["测评种草型", /测评|好物|种草|推荐|避坑/],
    ["观点口播型", /观点|认知|为什么|底层逻辑|口播/],
    ["本地探店型", /探店|到店|同城|门店|体验/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? "";
}

function inferTargetUsers(text: string) {
  const users: string[] = [];
  const rules: Array<[string, RegExp]> = [
    ["职场新人", /职场新人|上班族|打工人|办公/],
    ["自由职业者", /自由职业|副业|个体/],
    ["小微企业主", /小微企业|老板|创业者|商家/],
    ["宝妈/亲子家庭", /宝妈|妈妈|育儿|亲子|宝宝/],
    ["本地生活消费者", /同城|本地|门店|探店|到店/],
    ["内容创作者", /博主|自媒体|新媒体|创作者/],
  ];

  for (const [label, pattern] of rules) {
    if (pattern.test(text)) users.push(label);
  }

  return users.slice(0, 4);
}

function pickIntro(text: string) {
  const direct = pickByLabels(text, ["账号简介", "主页简介", "个人简介", "简介", "介绍", "签名", "bio"]);
  if (direct) return direct;

  return (
    text
      .split(/\n+/)
      .map((line) => line.trim())
      .find(
        (line) =>
          line.length >= 12 &&
          line.length <= 120 &&
          !extractCandidateUrls(line).length &&
          !/(粉丝|播放|阅读|点赞|收藏|评论)/.test(line),
      ) ?? ""
  );
}

function pickByLabels(text: string, labels: string[]) {
  const lines = text.split(/\n+/).map((line) => line.trim());
  for (const label of labels) {
    const labelPattern = escapeRegExp(label);
    const inline = text.match(new RegExp(`${labelPattern}\\s*[:：=]\\s*([^\\n]{1,120})`, "i"));
    if (inline?.[1]) return cleanupFieldValue(inline[1]);

    const looseLine = lines.find((line) => new RegExp(`^${labelPattern}\\s+`, "i").test(line));
    if (looseLine) return cleanupFieldValue(looseLine.replace(new RegExp(`^${labelPattern}\\s+`, "i"), ""));
  }
  return "";
}

function pickNumber(text: string, labels: string[]) {
  for (const label of labels) {
    const labelPattern = escapeRegExp(label);
    const pattern = new RegExp(
      `${labelPattern}\\s*[:：=]?\\s*([\\d.]+\\s*(?:万|w|W|k|K|千|亿)?)`,
      "i",
    );
    const match = text.match(pattern);
    if (match?.[1]) return match[1].replace(/\s+/g, "");
  }
  return "";
}

function cleanupFieldValue(value: string) {
  return value
    .replace(/^[：:=\s]+/, "")
    .replace(/[，,。；;|｜].*$/, "")
    .trim()
    .slice(0, 120);
}

function inferInputType(rawInput: string, urls: string[], textWithoutUrls: string): AccountInputType {
  if (!rawInput.trim()) return "unknown";
  if (urls.length && textWithoutUrls.replace(/\s+/g, "").length >= 4) return "mixed";
  if (urls.length) return "url";
  return "text";
}

function normalizeUrl(rawUrl: string) {
  const cleaned = trimUrlPunctuation(rawUrl.trim());
  if (!cleaned) return "";
  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
}

function extractCandidateUrls(input: string) {
  if (!input.trim()) return [];
  const domainPattern = supportedDomains.map(escapeRegExp).join("|");
  const supportedUrlPattern = new RegExp(
    `(?:https?:\\/\\/)?(?:[\\w-]+\\.)*(?:${domainPattern})[^\\s"'<>，。；;、）)]*`,
    "gi",
  );
  const genericUrlPattern =
    /https?:\/\/[^\s"'<>，。；;、）)]+|(?:www\.)?(?=[A-Za-z0-9.-]*[A-Za-z])[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?:\/[^\s"'<>，。；;、）)]*)?/gi;
  return dedupeStrings([
    ...(input.match(supportedUrlPattern) ?? []),
    ...(input.match(genericUrlPattern) ?? []),
  ].map(trimUrlPunctuation));
}

function stripUrls(input: string, urls: string[]) {
  return urls
    .reduce((next, url) => next.replace(url, "").replace(normalizeUrl(url), ""), input)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function trimUrlPunctuation(value: string) {
  return value.replace(/[，。；;、,.!?！？）)\]}>"']+$/g, "");
}

function hostMatches(hostname: string, domain: string) {
  const host = hostname.toLowerCase();
  const normalizedDomain = domain.toLowerCase();
  return host === normalizedDomain || host.endsWith(`.${normalizedDomain}`);
}

function getConfidence({
  hasAccountDetails,
  inputType,
  isShortLink,
  isValidProfileUrl,
  platform,
}: {
  hasAccountDetails: boolean;
  inputType: AccountInputType;
  isShortLink: boolean;
  isValidProfileUrl: boolean;
  platform: AccountPlatform;
}) {
  let score = inputType === "unknown" ? 0 : 0.15;
  if (platform !== "unknown") score += 0.28;
  if (isValidProfileUrl) score += 0.22;
  if (isShortLink) score += 0.08;
  if (hasAccountDetails) score += 0.27;
  return Math.min(1, Number(score.toFixed(2)));
}

function getWarningsForResult(result: AccountParserResult) {
  const warnings: string[] = [];
  if (result.rawUrl && result.platform === "unknown") {
    warnings.push("暂时无法识别该链接，请手动选择平台。");
  }
  if (result.isShortLink) {
    warnings.push("已识别为短链接，只能判断平台，无法展开读取账号详情。");
  }
  if (result.linkType === "content") {
    warnings.push("已识别为单条内容链接，账号详细信息可能需要手动补充。");
  }
  const hasAccountDetails = Boolean(
    result.accountName ||
      result.accountId ||
      result.bio ||
      result.followers ||
      result.avgViews ||
      result.recentPosts.length,
  );
  if (result.platform !== "unknown" && !hasAccountDetails) {
    warnings.push("已识别平台，但无法读取账号详细信息，请补充账号简介、粉丝数和近期内容。");
  }
  return dedupeStrings(warnings);
}

function normalizeRecentPosts(value: unknown): ParsedRecentPost[] {
  if (!Array.isArray(value)) return [];
  const posts: ParsedRecentPost[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;
    const title = readString(item.title);
    if (!title) continue;

    posts.push({
      comments: readString(item.comments) || undefined,
      follows: readString(item.follows) || undefined,
      likes: readString(item.likes) || undefined,
      saves: readString(item.saves) || undefined,
      title,
      views: readString(item.views) || undefined,
    });
  }

  return posts.slice(0, 10);
}

function toPlatform(value: string): AccountPlatform {
  const text = value.toLowerCase();
  if (/xiaohongshu|xhs|小红书/.test(text)) return "xiaohongshu";
  if (/douyin|抖音/.test(text)) return "douyin";
  if (/bilibili|b站/.test(text)) return "bilibili";
  if (/kuaishou|快手/.test(text)) return "kuaishou";
  if (/公众号|official/.test(text)) return "wechat_official";
  if (/视频号|微信|channels/.test(text)) return "wechat_channels";
  if (/weibo|微博/.test(text)) return "weibo";
  return "unknown";
}

function getPlatformLabel(platform: AccountPlatform) {
  return platformConfigs.find((item) => item.platform === platform)?.label ?? "未知平台";
}

function getLinkTypeLabel(linkType: AccountLinkType) {
  const labels: Record<AccountLinkType, string> = {
    content: "单条内容",
    profile: "账号主页",
    short: "短链接",
    unknown: "未识别",
    webpage: "普通网页",
  };

  return labels[linkType];
}

function isLikelyNickname(text: string) {
  return /^@?[\p{L}\p{N}_\-·.（）()]{2,32}$/u.test(text.trim());
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => readString(item)).filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function dedupeStrings(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
