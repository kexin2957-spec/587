import { redirect } from "next/navigation";
import {
  getCurrentAuthProfile,
  isMockAdminModeEnabled,
} from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authState = await getCurrentAuthProfile();

  if (!authState.isConfigured) {
    if (isMockAdminModeEnabled()) {
      return (
        <div>
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Mock admin mode is enabled for local demo validation. Configure
            Supabase Auth and an admin profile before production launch.
          </div>
          {children}
        </div>
      );
    }

    redirect("/sign-in?next=/admin&reason=supabase");
  }

  if (!authState.user) {
    redirect("/sign-in?next=/admin&reason=auth");
  }

  if (authState.profile?.role !== "admin") {
    redirect("/sign-in?next=/admin&reason=admin");
  }

  return children;
}
