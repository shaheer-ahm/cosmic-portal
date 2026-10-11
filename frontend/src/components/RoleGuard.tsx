import React from "react";
import type { UserRole } from "../types/domain";

interface RoleGuardProps {
  currentRole: UserRole;
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  currentRole,
  allowedRoles,
  children,
  fallback = null,
}) => {
  return allowedRoles.includes(currentRole) ? <>{children}</> : <>{fallback}</>;
};