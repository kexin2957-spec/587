import type { Metadata } from "next";
import { MediaAccountDiagnosisAgent } from "@/components/tools/media-account-diagnosis-agent";

export const metadata: Metadata = {
  title: "新媒体账号增长诊断 Agent | AI Agent Marketplace",
  description:
    "粘贴账号链接或主页信息，系统会识别平台并提取你粘贴内容里的账号信息，再生成结构化新媒体增长诊断报告。",
};

export default function MediaAccountDiagnosisPage() {
  return <MediaAccountDiagnosisAgent />;
}
