import assert from "node:assert/strict";
import test from "node:test";
import { buildAccountProfileUrlCandidates, parseAccountInput } from "../lib/tools/account-parser.ts";

test("recognizes xiaohongshu profile URLs without protocol", () => {
  const result = parseAccountInput("www.xiaohongshu.com/user/profile/abc123");

  assert.equal(result.platform, "xiaohongshu");
  assert.equal(result.platformLabel, "小红书");
  assert.equal(result.inputType, "url");
  assert.equal(result.isValidProfileUrl, true);
  assert.equal(result.linkType, "profile");
  assert.equal(result.isShortLink, false);
  assert.equal(result.normalizedUrl, "https://www.xiaohongshu.com/user/profile/abc123");
  assert.equal(result.accountId, "abc123");
});

test("recognizes xhslink short links", () => {
  const result = parseAccountInput("https://xhslink.com/a/abc");

  assert.equal(result.platform, "xiaohongshu");
  assert.equal(result.isShortLink, true);
  assert.equal(result.linkType, "short");
  assert.equal(result.isValidProfileUrl, false);
});

test("recognizes douyin user URLs", () => {
  const result = parseAccountInput("https://www.douyin.com/user/MS4wLjABAAAA-test");

  assert.equal(result.platform, "douyin");
  assert.equal(result.isValidProfileUrl, true);
  assert.equal(result.linkType, "profile");
  assert.equal(result.accountId, "MS4wLjABAAAA-test");
});

test("recognizes v.douyin short links", () => {
  const result = parseAccountInput("https://v.douyin.com/iAbCdE/");

  assert.equal(result.platform, "douyin");
  assert.equal(result.isShortLink, true);
  assert.equal(result.linkType, "short");
  assert.equal(result.isValidProfileUrl, false);
});

test("recognizes bilibili profile URLs", () => {
  const result = parseAccountInput("https://space.bilibili.com/123456");

  assert.equal(result.platform, "bilibili");
  assert.equal(result.platformLabel, "B站");
  assert.equal(result.isValidProfileUrl, true);
  assert.equal(result.linkType, "profile");
  assert.equal(result.accountId, "123456");
});

test("recognizes b23 short links", () => {
  const result = parseAccountInput("https://b23.tv/abc123");

  assert.equal(result.platform, "bilibili");
  assert.equal(result.isShortLink, true);
  assert.equal(result.linkType, "short");
  assert.equal(result.isValidProfileUrl, false);
});

test("recognizes kuaishou profile URLs", () => {
  const result = parseAccountInput("https://www.kuaishou.com/profile/3xabc");

  assert.equal(result.platform, "kuaishou");
  assert.equal(result.isValidProfileUrl, true);
  assert.equal(result.linkType, "profile");
  assert.equal(result.accountId, "3xabc");
});

test("recognizes mp.weixin official account links", () => {
  const result = parseAccountInput("https://mp.weixin.qq.com/s?__biz=MzA1234567890&mid=1");

  assert.equal(result.platform, "wechat_official");
  assert.equal(result.platformLabel, "公众号");
  assert.equal(result.linkType, "content");
  assert.equal(result.isValidProfileUrl, false);
  assert.equal(result.accountId, "MzA1234567890");
});

test("recognizes xiaohongshu content links", () => {
  const result = parseAccountInput("https://www.xiaohongshu.com/explore/65abc");

  assert.equal(result.platform, "xiaohongshu");
  assert.equal(result.linkType, "content");
  assert.equal(result.isValidProfileUrl, false);
});

test("keeps unsupported profile links as unknown platform URLs", () => {
  const result = parseAccountInput("https://example.com/profile/abc");

  assert.equal(result.platform, "unknown");
  assert.equal(result.inputType, "url");
  assert.equal(result.linkType, "webpage");
  assert.equal(result.isValidProfileUrl, false);
  assert.match(result.warnings.join("\n"), /暂时无法识别该链接/);
});

test("extracts basic fields from ordinary Chinese account text", () => {
  const result = parseAccountInput(`
账号名称：小林AI提效
小红书ID：ai_growth_2026
简介：分享 AI 工具和办公自动化
粉丝数：8600
平均播放量：3200
内容：这 5 个 AI 工具让我每天少加班 2 小时，播放12800，点赞680，评论96
`);

  assert.equal(result.inputType, "text");
  assert.equal(result.accountName, "小林AI提效");
  assert.equal(result.accountId, "ai_growth_2026");
  assert.equal(result.bio, "分享 AI 工具和办公自动化");
  assert.equal(result.followers, "8600");
  assert.equal(result.avgViews, "3200");
  assert.equal(result.recentPosts.length, 1);
  assert.match(result.recentPosts[0].title, /AI 工具/);
  assert.equal(result.recentPosts[0].views, "12800");
  assert.equal(result.recentPosts[0].likes, "680");
  assert.equal(result.recentPosts[0].comments, "96");
  assert.equal(result.inferredField, "AI");
  assert.ok(result.targetUsers.includes("职场新人"));
});

test("extracts platform account id labels from copied profile text", () => {
  assert.equal(parseAccountInput("抖音ID：douyin-growth-01").accountId, "douyin-growth-01");
  assert.equal(parseAccountInput("B站 UID: 12345678").accountId, "12345678");
  assert.equal(parseAccountInput("平台号 ks_2026").accountId, "ks_2026");
});

test("builds public profile crawl candidates from platform and account id", () => {
  assert.deepEqual(buildAccountProfileUrlCandidates({ accountId: "red_2026", platform: "小红书" }), [
    "https://www.xiaohongshu.com/user/profile/red_2026",
  ]);
  assert.deepEqual(buildAccountProfileUrlCandidates({ accountId: "12345678", platform: "B站" }), [
    "https://space.bilibili.com/12345678",
  ]);
  assert.deepEqual(buildAccountProfileUrlCandidates({ accountId: "654321", platform: "微博" }), [
    "https://weibo.com/u/654321",
  ]);
});

test("recognizes mixed link and copied profile text", () => {
  const result = parseAccountInput(`
https://www.xiaohongshu.com/user/profile/abc123
账号名称：小林AI提效
简介：每天分享 AI 提效案例
粉丝：1.2万
`);

  assert.equal(result.inputType, "mixed");
  assert.equal(result.platform, "xiaohongshu");
  assert.equal(result.accountName, "小林AI提效");
  assert.equal(result.followers, "1.2万");
  assert.equal(result.bio, "每天分享 AI 提效案例");
});
