import type { Metadata } from "next";

export const siteConfig = {
  description:
    "Buy hosted, license-protected AI agents for website sales, lead capture, e-commerce support, and custom business workflows.",
  name: "AI Agent Marketplace",
  socialImage: "/social/marketplace-og.svg",
  url: getSiteUrl(),
};

type PageMetadataInput = {
  description: string;
  image?: string;
  path?: string;
  title: string;
};

export function buildPageMetadata({
  description,
  image = siteConfig.socialImage,
  path = "/",
  title,
}: PageMetadataInput): Metadata {
  const metadataBase = siteConfig.url ? new URL(siteConfig.url) : undefined;
  const url = metadataBase ? new URL(path, metadataBase) : path;
  const imageUrl = metadataBase ? new URL(image, metadataBase) : image;

  return {
    alternates: {
      canonical: url,
    },
    description,
    metadataBase,
    openGraph: {
      description,
      images: [
        {
          alt: title,
          height: 630,
          url: imageUrl,
          width: 1200,
        },
      ],
      locale: "en_US",
      siteName: siteConfig.name,
      title,
      type: "website",
      url,
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [imageUrl.toString()],
      title,
    },
  };
}

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://ai-agent-marketplace.vercel.app";
}
