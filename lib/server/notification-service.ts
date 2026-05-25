export type PurchaseRequestNotification = {
  agent_slug?: string | null;
  email: string;
  id: string;
  language?: string | null;
  name: string;
  request_type: string;
  source_page?: string | null;
};

export type CustomRequestNotification = {
  company_name: string;
  contact_email: string;
  contact_name: string;
  id: string;
  language?: string | null;
  source_page?: string | null;
};

export async function notifyAdminNewPurchaseRequest(
  request: PurchaseRequestNotification,
) {
  void request;
  // Launch stub. Add Resend, SendGrid, or another provider here.
  return { ok: true, provider: "not_configured" as const };
}

export async function notifyAdminNewCustomRequest(
  request: CustomRequestNotification,
) {
  void request;
  // Launch stub. Add Resend, SendGrid, or another provider here.
  return { ok: true, provider: "not_configured" as const };
}
