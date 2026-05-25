import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Apply to become a creator on the AI Agent Marketplace. Seller agents require platform review and prepare for revenue share.",
  image: "/social/marketplace-og.svg",
  path: "/become-a-seller",
  title: "Become an AI Agent Seller | Creator Marketplace",
});

export default function BecomeSellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
