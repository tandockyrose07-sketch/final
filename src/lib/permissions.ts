import { UserRole } from "@/contexts/AuthContext";

// Define which routes each role can access
const rolePermissions: Record<UserRole, string[]> = {
  admin: ["/dashboard", "/access-logs", "/access-control"],
  security: ["/dashboard", "/access-logs", "/access-control"],
  super_admin: [
    "/dashboard",
    "/access-logs",
    "/access-control",
    "/users",
    "/enrollment",
    "/analytics",
    "/settings",
  ],
};

export const canAccessRoute = (role: UserRole | null, path: string): boolean => {
  if (!role) return false;
  return rolePermissions[role]?.includes(path) ?? false;
};

export const getDefaultRouteForRole = (role: UserRole | null): string => {
  return "/dashboard"; // All roles can access dashboard
};

export const getAllowedRoutes = (role: UserRole | null): string[] => {
  if (!role) return [];
  return rolePermissions[role] ?? [];
};
