import type { AppLanguage } from "@/lib/i18n/language";

export type PolicySlug =
  | "privacy-policy"
  | "refund-policy"
  | "review-policy"
  | "seller-guidelines"
  | "license"
  | "terms";

type LocalizedPolicyContent = {
  description: string;
  sections: Array<{
    body: string[];
    title: string;
  }>;
  title: string;
};

type PolicyContent = Record<AppLanguage, LocalizedPolicyContent>;

export const policyContent: Record<PolicySlug, PolicyContent> = {
  "privacy-policy": {
    en: {
      title: "Privacy Policy",
      description:
        "A launch-ready draft for how the marketplace handles account, request, and agent usage data.",
      sections: [
        {
          title: "Information we collect",
          body: [
            "We may collect account details, seller application details, buyer request forms, custom service requirements, and agent submission content.",
            "Agent demos may require sample questions or workflow details. Avoid submitting sensitive production data unless a formal agreement is in place.",
          ],
        },
        {
          title: "How information is used",
          body: [
            "Information is used to operate the marketplace, review agents, follow up on purchase requests, and scope custom AI agent services.",
            "We may use aggregated marketplace data to improve categories, review quality, and buyer support workflows.",
          ],
        },
        {
          title: "Draft status",
          body: [
            "This policy is a professional draft and should be reviewed by legal counsel before launch.",
          ],
        },
      ],
    },
    zh: {
      title: "隐私政策",
      description:
        "用于说明平台如何处理账号、需求表单、Agent 使用和提交内容的上线前政策草案。",
      sections: [
        {
          title: "我们收集的信息",
          body: [
            "平台可能收集账号信息、创作者申请、买家购买需求、定制服务需求和 Agent 提交内容。",
            "Agent Demo 可能需要示例问题或流程信息。在正式协议完成前，请避免提交敏感生产数据。",
          ],
        },
        {
          title: "信息如何使用",
          body: [
            "信息用于运营商店、审核 Agent、跟进购买请求，以及评估定制 AI Agent 服务。",
            "平台可能使用汇总后的数据来优化分类、审核质量和买家支持流程。",
          ],
        },
        {
          title: "草案说明",
          body: ["本政策为专业草案版本，正式上线前应由法律顾问审核。"],
        },
      ],
    },
  },
  "refund-policy": {
    en: {
      title: "Refund Policy",
      description:
        "A draft refund policy for digital AI agent assets and custom AI agent services.",
      sections: [
        {
          title: "Digital agent and template purchases",
          body: [
            "Digital agent, prompt template, workflow template, and setup guide purchases may have limited refunds because access can be delivered immediately.",
            "If an agent does not match its public description, the buyer can contact platform support for review.",
          ],
        },
        {
          title: "Custom services",
          body: [
            "Custom service refunds depend on the project stage, delivered work, consultation time, and agreed scope.",
            "Refund availability may be different before kickoff, during implementation, after delivery, and after launch support begins.",
          ],
        },
        {
          title: "Draft status",
          body: [
            "This refund policy is a draft and should be reviewed before public launch or payment activation.",
          ],
        },
      ],
    },
    zh: {
      title: "退款政策",
      description: "适用于数字 Agent 资产和定制 AI Agent 服务的退款政策草案版本。",
      sections: [
        {
          title: "数字 Agent 与模板购买",
          body: [
            "数字 Agent、Prompt 模板、工作流模板和配置说明可能在交付后立即可访问，因此退款范围可能有限。",
            "如果 Agent 与公开描述明显不符，买家可以联系平台支持进行审核。",
          ],
        },
        {
          title: "定制服务",
          body: [
            "定制服务退款取决于项目阶段、已交付工作、咨询时间和双方确认的范围。",
            "在项目启动前、开发中、交付后以及上线支持阶段，退款规则可能不同。",
          ],
        },
        {
          title: "草案说明",
          body: ["本退款政策为草案版本，正式上线或启用支付前应完成审核。"],
        },
      ],
    },
  },
  "review-policy": {
    en: {
      title: "Review Policy",
      description:
        "How platform review works for marketplace listings, reviews, and seller-submitted agents.",
      sections: [
        {
          title: "Platform review",
          body: [
            "The platform can approve, reject, request changes, suspend, or remove agents before or after public listing.",
            "Seller-submitted agents remain private until admin review is complete.",
          ],
        },
        {
          title: "Revision and resubmission",
          body: [
            "Rejected or needs-changes agents can be revised and resubmitted for another review cycle.",
            "Admin feedback should be used to improve listing accuracy, setup instructions, demo quality, and data permission notes.",
          ],
        },
        {
          title: "Unsafe or misleading content",
          body: [
            "The platform may remove unsafe, misleading, infringing, spammy, or policy-violating content.",
            "Public user reviews, if enabled, should remain pending until approved to prevent spam and abuse.",
          ],
        },
      ],
    },
    zh: {
      title: "审核政策",
      description: "说明平台如何审核商店内容、评价和创作者提交的 Agent。",
      sections: [
        {
          title: "平台审核",
          body: [
            "平台可以在公开展示前后批准、拒绝、要求修改、暂停或移除 Agent。",
            "创作者提交的 Agent 在管理员审核完成前不会公开展示。",
          ],
        },
        {
          title: "修改与重新提交",
          body: [
            "被拒绝或要求修改的 Agent 可以根据反馈调整后重新提交审核。",
            "管理员反馈应用于提升列表准确性、配置说明、Demo 质量和数据权限说明。",
          ],
        },
        {
          title: "不安全或误导性内容",
          body: [
            "平台可以移除不安全、误导、侵权、垃圾信息或违反政策的内容。",
            "如果后续开放公开评价，评价应先进入待审核状态，以防止垃圾内容和滥用。",
          ],
        },
      ],
    },
  },
  "seller-guidelines": {
    en: {
      title: "Seller Guidelines",
      description:
        "Rules for creators who want to submit and sell AI agents on the marketplace.",
      sections: [
        {
          title: "Original and accurate content",
          body: [
            "Do not upload stolen content, copied templates, or assets you do not have permission to sell.",
            "Do not make misleading claims about agent capabilities, integrations, compliance, or guaranteed business results.",
          ],
        },
        {
          title: "Clear buyer expectations",
          body: [
            "Provide clear usage instructions, setup requirements, feature descriptions, and examples.",
            "Disclose required data, API keys, third-party tools, integrations, model costs, and permission needs.",
          ],
        },
        {
          title: "Demo and review",
          body: [
            "Provide a live demo, screenshots, or sample outputs when possible.",
            "Platform review is required before any seller-uploaded agent can be publicly listed.",
          ],
        },
      ],
    },
    zh: {
      title: "创作者指南",
      description: "面向希望在商店提交并销售 AI Agent 的创作者规则。",
      sections: [
        {
          title: "原创且准确的内容",
          body: [
            "不得上传盗用内容、复制模板，或没有销售授权的资产。",
            "不得对 Agent 能力、集成、合规性或商业结果做误导性承诺。",
          ],
        },
        {
          title: "清晰的买家预期",
          body: [
            "必须提供清晰的使用说明、配置要求、功能描述和示例。",
            "必须披露所需数据、API Key、第三方工具、集成、模型成本和权限需求。",
          ],
        },
        {
          title: "Demo 与审核",
          body: [
            "条件允许时，应提供在线 Demo、截图或示例输出。",
            "所有创作者上传的 Agent 在公开展示前都必须经过平台审核。",
          ],
        },
      ],
    },
  },
  license: {
    en: {
      title: "Agent License Policy",
      description:
        "How hosted AI agent usage licenses work, including domain authorization, resale restrictions, and suspension rules.",
      sections: [
        {
          title: "Usage license, not ownership",
          body: [
            "Customers purchase a hosted usage license for the selected AI agent. They do not purchase ownership of the raw source code, private prompts, internal workflows, model configuration, or platform infrastructure.",
            "Customers receive hosted agent access, embed code, a customer dashboard, license key, and installation documentation.",
          ],
        },
        {
          title: "Authorized domains",
          body: [
            "Each license is limited to the domains approved for that customer, such as example.com or www.example.com.",
            "Multi-site usage, client resale, or use on additional brands requires an additional license or a custom agreement.",
          ],
        },
        {
          title: "No resale or redistribution",
          body: [
            "Customers may not resell, redistribute, sublicense, copy, reverse engineer, republish, or repackage the hosted agent as their own product.",
            "Copying embed code to unauthorized domains may cause the widget to show a license error and may be logged as a blocked-domain event.",
          ],
        },
        {
          title: "Suspension and custom terms",
          body: [
            "The platform may suspend or deactivate licenses for abuse, non-payment, unauthorized redistribution, domain misuse, or attempts to bypass license checks.",
            "Custom projects may include separate contract terms for integrations, data handling, support, and ownership of project-specific deliverables.",
          ],
        },
      ],
    },
    zh: {
      title: "Agent License 政策",
      description:
        "说明托管 AI Agent 使用授权、域名限制、禁止转售以及暂停规则。",
      sections: [
        {
          title: "购买的是使用授权，不是所有权",
          body: [
            "客户购买的是所选 AI Agent 的托管使用授权，不是原始源代码、私有 Prompt、内部工作流、模型配置或平台基础设施的所有权。",
            "客户会收到托管 Agent 访问链接、嵌入代码、客户后台、license key 和安装文档。",
          ],
        },
        {
          title: "授权域名",
          body: [
            "每个 license 仅限客户已授权的域名使用，例如 example.com 或 www.example.com。",
            "多站点使用、为客户转售或在其他品牌网站使用，需要额外 license 或单独定制协议。",
          ],
        },
        {
          title: "禁止转售和再分发",
          body: [
            "客户不得转售、再分发、转授权、复制、逆向工程、重新发布，或将托管 Agent 重新包装成自己的产品。",
            "如果嵌入代码被复制到未授权域名，widget 会显示 license 错误，并可能记录 blocked-domain 事件。",
          ],
        },
        {
          title: "暂停和定制条款",
          body: [
            "如出现滥用、未付款、未授权分发、域名滥用或试图绕过授权检查，平台可以暂停或停用 license。",
            "定制项目可根据集成、数据处理、支持和项目专属交付物另行约定合同条款。",
          ],
        },
      ],
    },
  },
  terms: {
    en: {
      title: "Terms of Service",
      description:
        "A concise draft for marketplace participation, requests, listings, and custom services.",
      sections: [
        {
          title: "Marketplace use",
          body: [
            "Users may browse agents, request purchases, request setup services, and submit custom service requirements.",
            "The current marketplace uses lead forms and does not yet automate payment, payout, or revenue-share settlement.",
          ],
        },
        {
          title: "Listings and services",
          body: [
            "Agent listings should describe what the buyer receives, setup requirements, limitations, and data permissions.",
            "Custom service scopes, timelines, deliverables, and pricing should be confirmed before work begins.",
          ],
        },
        {
          title: "Draft status",
          body: [
            "These terms are a draft and should be reviewed before launch.",
          ],
        },
      ],
    },
    zh: {
      title: "服务条款",
      description: "用于说明商店参与、需求提交、Agent 列表和定制服务的条款草案。",
      sections: [
        {
          title: "商店使用",
          body: [
            "用户可以浏览 Agent、提交购买需求、申请配置服务，以及提交定制服务需求。",
            "当前商店使用线索表单承接需求，尚未自动化支付、提现或收入分成结算。",
          ],
        },
        {
          title: "列表与服务",
          body: [
            "Agent 列表应说明买家会收到什么、配置要求、限制和数据权限。",
            "定制服务的范围、时间计划、交付内容和价格应在开始工作前确认。",
          ],
        },
        {
          title: "草案说明",
          body: ["本服务条款为草案版本，正式上线前应完成审核。"],
        },
      ],
    },
  },
};

export function getPolicyContent(slug: PolicySlug, language: AppLanguage) {
  return policyContent[slug][language] ?? policyContent[slug].en;
}
