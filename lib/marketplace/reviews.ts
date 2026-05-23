import type { AppLanguage } from "@/lib/i18n/language";
import type { DemoAgent } from "@/lib/marketplace/demo-data";

export type AgentReview = {
  commentEn: string;
  commentZh: string;
  createdAt: string;
  id: string;
  rating: number;
  reviewerName: string;
  status: "approved" | "pending" | "rejected";
};

const sharedReviews: AgentReview[] = [
  {
    commentEn:
      "The setup notes were clear, and the demo made it easy for our team to judge fit before requesting purchase.",
    commentZh:
      "安装说明很清楚，Demo 也方便我们在提交购买需求前判断是否适合。",
    createdAt: "2026-05-18",
    id: "review-operations-lead",
    rating: 5,
    reviewerName: "Operations Lead",
    status: "approved",
  },
  {
    commentEn:
      "Good starting point for a business workflow. We still asked for a few custom changes.",
    commentZh:
      "作为业务流程的起点很实用。我们后续仍然提出了一些定制需求。",
    createdAt: "2026-05-15",
    id: "review-growth-manager",
    rating: 4,
    reviewerName: "Growth Manager",
    status: "approved",
  },
  {
    commentEn:
      "The data and permission notes helped us review security requirements with internal stakeholders.",
    commentZh:
      "数据与权限说明帮助我们和内部团队一起评估安全要求。",
    createdAt: "2026-05-12",
    id: "review-it-owner",
    rating: 5,
    reviewerName: "IT Owner",
    status: "approved",
  },
];

const reviewsBySlug: Record<string, AgentReview[]> = {
  "website-customer-support-agent": sharedReviews,
  "internal-knowledge-base-agent": [
    sharedReviews[2],
    {
      commentEn:
        "The answers were easier to audit because the package separates setup instructions from data permissions.",
      commentZh:
        "该套件把配置说明和数据权限分开，方便我们审核回答来源和使用边界。",
      createdAt: "2026-05-10",
      id: "review-knowledge-admin",
      rating: 5,
      reviewerName: "Knowledge Admin",
      status: "approved",
    },
  ],
  "real-estate-lead-agent": [
    sharedReviews[0],
    {
      commentEn:
        "The lead qualification flow covered budget, area, and timeline without feeling too long.",
      commentZh:
        "获客筛选流程覆盖了预算、区域和时间计划，同时不会显得太长。",
      createdAt: "2026-05-08",
      id: "review-property-team",
      rating: 5,
      reviewerName: "Property Team",
      status: "approved",
    },
  ],
  "restaurant-booking-agent": [
    sharedReviews[1],
    {
      commentEn:
        "Pending review placeholder. Public display should wait for admin approval.",
      commentZh:
        "待审核评价占位。公开展示前应等待管理员审核。",
      createdAt: "2026-05-20",
      id: "review-pending-restaurant",
      rating: 4,
      reviewerName: "Pending Reviewer",
      status: "pending",
    },
  ],
};

export function getApprovedAgentReviews(agent: DemoAgent) {
  return (reviewsBySlug[agent.slug] ?? sharedReviews).filter(
    (review) => review.status === "approved",
  );
}

export function getLocalizedReview(review: AgentReview, language: AppLanguage) {
  return language === "zh"
    ? review.commentZh || review.commentEn
    : review.commentEn || review.commentZh;
}

export function getPendingReviewCount() {
  return Object.values(reviewsBySlug)
    .flat()
    .filter((review) => review.status === "pending").length;
}
