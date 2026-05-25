import { redirect } from "next/navigation";
import {
  getCurrentAuthProfile,
  isMockSellerModeEnabled,
} from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authState = await getCurrentAuthProfile();

  if (!authState.isConfigured) {
    if (isMockSellerModeEnabled()) {
      return (
        <div>
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Mock seller mode is enabled for local validation. Configure Supabase
            Auth, approve a seller profile, and disable mock access before launch.
          </div>
          {children}
        </div>
      );
    }

    redirect("/sign-in?next=/seller&reason=supabase");
  }

  if (!authState.user) {
    redirect("/sign-in?next=/seller&reason=auth");
  }

  if (!["seller", "admin"].includes(authState.profile?.role ?? "buyer")) {
    redirect("/become-a-seller?reason=seller-role-required");
  }

  return children;
}
