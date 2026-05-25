import { AgentInstallDocPage } from "@/components/docs/agent-install-doc-page";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  description:
    "Bilingual delivery and installation documentation for the E-commerce Product Support Agent.",
  image: "/social/ecommerce-agent-og.svg",
  path: "/docs/install-ecommerce-agent",
  title: "Install E-commerce Support Agent | AI Agent Marketplace",
});

export default function InstallEcommerceAgentPage() {
  return <AgentInstallDocPage type="ecommerce" />;
}
