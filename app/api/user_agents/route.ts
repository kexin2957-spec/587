import { NextRequest, NextResponse } from "next/server";
import { demoAgents, demoCategories } from "@/lib/marketplace/demo-data";

export const dynamic = "force-dynamic";

type UserAgentStatus = "active" | "expired" | "unused";

type UserAgentRecord = {
  agentName: string;
  agentSlug: string;
  category: string;
  dailyLimit: number;
  description: string;
  iconUrl: string;
  id: string;
  industry: string;
  isFavorite: boolean;
  lastUsedAt: string | null;
  launchUrl: string;
  status: UserAgentStatus;
  tags: string[];
  usageToday: number;
  useCase: string;
};

const ownedAgentSlugs = [
  "media-account-diagnosis-agent",
  "website-customer-support-agent",
  "ecommerce-product-support-agent",
];

const defaultCategoryBySlug: Record<string, string> = {
  "ecommerce-product-support-agent": "电商运营",
  "media-account-diagnosis-agent": "社交媒体运营",
  "website-customer-support-agent": "客户服务",
};

const statusBySlug: Record<string, UserAgentStatus> = {
  "ecommerce-product-support-agent": "unused",
  "media-account-diagnosis-agent": "active",
  "website-customer-support-agent": "active",
};

const usageBySlug: Record<string, number> = {
  "ecommerce-product-support-agent": 0,
  "media-account-diagnosis-agent": 2,
  "website-customer-support-agent": 3,
};

const favoriteBySlug: Record<string, boolean> = {
  "media-account-diagnosis-agent": true,
};

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id")?.trim();

  if (!userId) {
    return NextResponse.json(
      { error: "Missing user_id.", ok: false },
      { status: 400 },
    );
  }

  return NextResponse.json({
    data: buildUserAgents(userId),
    ok: true,
  });
}

export async function PATCH(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    updated: {
      action: payload.action ?? "update",
      agentIds: Array.isArray(payload.agentIds) ? payload.agentIds : [],
      category: typeof payload.category === "string" ? payload.category : null,
      isFavorite:
        typeof payload.isFavorite === "boolean" ? payload.isFavorite : null,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));

  return NextResponse.json({
    deleted: Array.isArray(payload.agentIds) ? payload.agentIds : [],
    ok: true,
  });
}

function buildUserAgents(userId: string): UserAgentRecord[] {
  return ownedAgentSlugs
    .map((slug, index) => {
      const agent = demoAgents.find((item) => item.slug === slug);
      if (!agent) return null;

      const category = demoCategories.find(
        (item) => item.slug === agent.categorySlug,
      );
      const lastUsedAt =
        slug === "ecommerce-product-support-agent"
          ? null
          : new Date(Date.now() - (index + 1) * 36 * 60 * 60 * 1000).toISOString();

      return {
        agentName: agent.titleZh || agent.titleEn,
        agentSlug: agent.slug,
        category: defaultCategoryBySlug[slug] ?? category?.nameZh ?? "未分类",
        dailyLimit: slug === "media-account-diagnosis-agent" ? 5 : 20,
        description: agent.shortDescriptionZh || agent.shortDescriptionEn,
        iconUrl: "",
        id: `${userId}:${agent.slug}`,
        industry: category?.nameZh ?? agent.categorySlug,
        isFavorite: Boolean(favoriteBySlug[slug]),
        lastUsedAt,
        launchUrl: getLaunchUrl(agent.slug, agent.demoUrl),
        status: statusBySlug[slug] ?? "active",
        tags: agent.tags ?? [],
        usageToday: usageBySlug[slug] ?? 0,
        useCase: getUseCase(agent.slug),
      } satisfies UserAgentRecord;
    })
    .filter((item): item is UserAgentRecord => Boolean(item));
}

function getLaunchUrl(slug: string, demoUrl: string) {
  if (slug === "media-account-diagnosis-agent") {
    return "/tools/media-account-diagnosis";
  }

  return demoUrl || `/agents/${slug}#live-demo`;
}

function getUseCase(slug: string) {
  const labels: Record<string, string> = {
    "ecommerce-product-support-agent": "商品咨询、售前答疑、订单线索承接",
    "media-account-diagnosis-agent": "账号诊断、内容规划、私域转化",
    "website-customer-support-agent": "网站客服、销售线索、访客转化",
  };

  return labels[slug] ?? "业务提效";
}
