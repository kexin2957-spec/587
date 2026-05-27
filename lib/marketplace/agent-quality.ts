export type AgentQualityInput = {
  agent_rights_confirmed?: boolean | null;
  category_slug?: string | null;
  cover_image_url?: string | null;
  data_permissions_en?: string | null;
  data_permissions_zh?: string | null;
  delivery_settings?: unknown;
  delivery_type?: string | null;
  demo_answers?: unknown;
  demo_questions?: unknown;
  description_en?: string | null;
  description_zh?: string | null;
  faq_en?: unknown;
  faq_zh?: unknown;
  features_en?: unknown;
  features_zh?: unknown;
  full_description_en?: string | null;
  full_description_zh?: string | null;
  limitations_en?: string | null;
  limitations_zh?: string | null;
  price_cny?: number | string | null;
  price_usd?: number | string | null;
  pricing_plans?: unknown;
  pricing_type?: string | null;
  rights_confirmed?: boolean | null;
  sample_conversation?: string | null;
  setup_instructions_en?: string | null;
  setup_instructions_zh?: string | null;
  short_description_en?: string | null;
  short_description_zh?: string | null;
  tags?: unknown;
  title_en?: string | null;
  title_zh?: string | null;
};

export type AgentQualityChecklistItem = {
  complete: boolean;
  id: string;
  label: string;
};

export type AgentQualityResult = {
  checklist: AgentQualityChecklistItem[];
  missingFields: string[];
  percentage: number;
  possibleFalseClaims: string[];
  submissionGateFailures: string[];
  warnings: string[];
};

export function evaluateAgentQuality(
  agent: AgentQualityInput,
): AgentQualityResult {
  const demoQuestions = toTextArray(agent.demo_questions);
  const demoAnswers = toTextArray(agent.demo_answers);
  const possibleFalseClaims = findPossibleFalseClaims(agent);

  const checklist: AgentQualityChecklistItem[] = [
    {
      complete: hasText(agent.title_en) || hasText(agent.title_zh),
      id: "title",
      label: "Title present",
    },
    {
      complete:
        hasText(agent.short_description_en) && hasText(agent.short_description_zh),
      id: "short_description",
      label: "Bilingual short description",
    },
    {
      complete:
        (hasText(agent.full_description_en) || hasText(agent.description_en)) &&
        (hasText(agent.full_description_zh) || hasText(agent.description_zh)),
      id: "full_description",
      label: "Full description",
    },
    {
      complete: hasText(agent.category_slug),
      id: "category",
      label: "Category",
    },
    {
      complete: toTextArray(agent.tags).length > 0,
      id: "tags",
      label: "Tags",
    },
    {
      complete: hasText(agent.cover_image_url),
      id: "cover_image",
      label: "Cover image",
    },
    {
      complete:
        toTextArray(agent.features_en).length > 0 ||
        toTextArray(agent.features_zh).length > 0,
      id: "features",
      label: "Features",
    },
    {
      complete: hasFaq(agent.faq_en) || hasFaq(agent.faq_zh),
      id: "faq",
      label: "FAQ",
    },
    {
      complete:
        demoQuestions.length >= 5 &&
        demoAnswers.length >= 5 &&
        hasText(agent.sample_conversation),
      id: "demo",
      label: "Demo questions and answers",
    },
    {
      complete: hasPricing(agent),
      id: "pricing",
      label: "Pricing",
    },
    {
      complete: hasDeliveryExplanation(agent),
      id: "delivery",
      label: "Delivery explanation",
    },
    {
      complete:
        hasText(agent.data_permissions_en) || hasText(agent.data_permissions_zh),
      id: "data_permissions",
      label: "Data permissions",
    },
    {
      complete: hasText(agent.limitations_en) || hasText(agent.limitations_zh),
      id: "limitations",
      label: "Limitations",
    },
    {
      complete:
        hasText(agent.setup_instructions_en) ||
        hasText(agent.setup_instructions_zh),
      id: "setup_instructions",
      label: "Setup instructions",
    },
    {
      complete: Boolean(agent.agent_rights_confirmed || agent.rights_confirmed),
      id: "originality",
      label: "Originality confirmation",
    },
  ];

  const completedCount = checklist.filter((item) => item.complete).length;
  const percentage = Math.round((completedCount / checklist.length) * 100);
  const missingFields = checklist
    .filter((item) => !item.complete)
    .map((item) => item.label);

  const submissionGateFailures = [
    !hasText(agent.cover_image_url) ? "Missing cover image." : "",
    !hasText(agent.category_slug) ? "Category is required." : "",
    !hasPricing(agent) ? "Pricing is required." : "",
    !hasText(agent.delivery_type) ? "Delivery type is required." : "",
    demoQuestions.length < 5 ? "At least 5 demo questions are required." : "",
    !(
      hasText(agent.data_permissions_en) || hasText(agent.data_permissions_zh)
    )
      ? "Data permissions are required."
      : "",
    !(hasText(agent.limitations_en) || hasText(agent.limitations_zh))
      ? "Limitations are required."
      : "",
    !(agent.agent_rights_confirmed || agent.rights_confirmed)
      ? "Originality confirmation is required."
      : "",
  ].filter(Boolean);

  const warnings = [
    percentage < 70 ? "Completeness is below 70%." : "",
    !hasText(agent.cover_image_url) ? "Missing cover image." : "",
    demoQuestions.length < 5 || demoAnswers.length < 5
      ? "Demo content needs at least 5 questions and 5 answers."
      : "",
    !hasFaq(agent.faq_en) && !hasFaq(agent.faq_zh) ? "No FAQ provided." : "",
    !hasDeliveryExplanation(agent) ? "Missing delivery explanation." : "",
    !(
      hasText(agent.data_permissions_en) || hasText(agent.data_permissions_zh)
    )
      ? "Missing data permissions."
      : "",
    !(hasText(agent.limitations_en) || hasText(agent.limitations_zh))
      ? "Missing limitations."
      : "",
    possibleFalseClaims.length > 0
      ? "Possible exaggerated or regulated claims need admin review."
      : "",
  ].filter(Boolean);

  return {
    checklist,
    missingFields,
    percentage,
    possibleFalseClaims,
    submissionGateFailures: dedupe(submissionGateFailures),
    warnings: dedupe(warnings),
  };
}

export function getAgentPublishWarnings(agent: AgentQualityInput) {
  const quality = evaluateAgentQuality(agent);
  const bilingualContentMissing =
    !hasText(agent.title_en) ||
    !hasText(agent.title_zh) ||
    !hasText(agent.short_description_en) ||
    !hasText(agent.short_description_zh) ||
    !(
      hasText(agent.full_description_en) ||
      hasText(agent.description_en)
    ) ||
    !(
      hasText(agent.full_description_zh) ||
      hasText(agent.description_zh)
    );

  return dedupe([
    ...quality.submissionGateFailures,
    bilingualContentMissing ? "Missing bilingual content." : "",
    !hasDeliveryExplanation(agent) ? "Missing delivery explanation." : "",
    !hasFaq(agent.faq_en) && !hasFaq(agent.faq_zh) ? "No FAQ provided." : "",
    ...quality.possibleFalseClaims.map((claim) => `Review claim: ${claim}`),
  ]);
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function toTextArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") {
          return item.split(/\r?\n|,/);
        }

        if (typeof item === "number") {
          return [String(item)];
        }

        return [];
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function hasFaq(value: unknown) {
  if (Array.isArray(value)) {
    return value.some((item) => {
      if (typeof item === "string") {
        return item.trim().length > 0;
      }

      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;

        return hasText(record.question) || hasText(record.answer);
      }

      return false;
    });
  }

  return hasText(value);
}

function hasPricing(agent: AgentQualityInput) {
  if (!hasText(agent.pricing_type)) {
    return false;
  }

  if (agent.pricing_type === "free" || agent.pricing_type === "custom_quote") {
    return true;
  }

  return (
    hasPositiveNumber(agent.price_usd) ||
    hasPositiveNumber(agent.price_cny) ||
    hasPricedPlan(agent.pricing_plans)
  );
}

function hasPositiveNumber(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0;
}

function hasPricedPlan(value: unknown) {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.some((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const record = item as Record<string, unknown>;

    return hasPositiveNumber(record.price_usd) || hasPositiveNumber(record.price_cny);
  });
}

function hasDeliveryExplanation(agent: AgentQualityInput) {
  return (
    hasText(agent.delivery_type) &&
    (hasRecordValues(agent.delivery_settings) ||
      hasText(agent.setup_instructions_en) ||
      hasText(agent.setup_instructions_zh))
  );
}

function hasRecordValues(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).some((item) => {
    if (typeof item === "string") {
      return item.trim().length > 0;
    }

    if (Array.isArray(item)) {
      return item.length > 0;
    }

    return Boolean(item);
  });
}

function findPossibleFalseClaims(agent: AgentQualityInput) {
  const source = [
    agent.title_en,
    agent.title_zh,
    agent.short_description_en,
    agent.short_description_zh,
    agent.full_description_en,
    agent.full_description_zh,
    agent.description_en,
    agent.description_zh,
    ...toTextArray(agent.features_en),
    ...toTextArray(agent.features_zh),
  ]
    .filter((item): item is string => typeof item === "string")
    .join(" \n ");

  const patterns: Array<{ label: string; pattern: RegExp }> = [
    { label: "Guaranteed outcome claim", pattern: /\bguarantee[ds]?\b/i },
    { label: "Absolute 100% claim", pattern: /\b100%\b/i },
    { label: "No-risk claim", pattern: /\bno[-\s]?risk\b/i },
    { label: "Certified or licensed claim", pattern: /\b(certified|licensed)\b/i },
    {
      label: "Professional replacement claim",
      pattern: /\breplaces?\s+(a\s+)?(doctor|lawyer|accountant|financial advisor)\b/i,
    },
    {
      label: "Regulated advice claim",
      pattern: /\b(legal|medical|financial)\s+advice\b/i,
    },
    { label: "Diagnosis or cure claim", pattern: /\b(diagnose|cure[sd]?)\b/i },
  ];

  return patterns
    .filter((item) => item.pattern.test(source))
    .map((item) => item.label);
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
