import type { Metadata } from "next";
import { MediaAccountDiagnosisAgent } from "@/components/tools/media-account-diagnosis-agent";

export const metadata: Metadata = {
  title: "新媒体账号增长诊断 Agent | AI Agent Marketplace",
  description:
    "选择平台并填写账号名，AI 会结合账号简介、粉丝数和近期内容数据生成结构化新媒体增长诊断报告。",
};

export default function MediaAccountDiagnosisPage() {
  return <MediaAccountDiagnosisAgent />;
}
