import { AgentInstallDocPage } from "@/components/docs/agent-install-doc-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  description:
    "Bilingual delivery and installation documentation for the Website Sales & Lead Capture Agent.",
  image: "/social/website-agent-og.svg",
  path: "/docs/install-website-agent",
  title: "Install Website Sales Agent | AI Agent Marketplace",
});

export default function InstallWebsiteAgentPage() {
  return <AgentInstallDocPage type="website" />;
}
