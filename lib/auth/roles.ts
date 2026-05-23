export const USER_ROLES = ["buyer", "seller", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type UserProfile = {
  created_at?: string;
  display_name: string | null;
  email: string;
  id: string;
  role: UserRole;
  updated_at?: string;
  user_id: string;
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}
