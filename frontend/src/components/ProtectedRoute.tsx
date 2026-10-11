import React from "react";
import { Navigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import type { UserRole } from "../types/domain";

interface ProtectedRouteProps {
  session: Session | null;
  userRole: UserRole;
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  session,
  userRole,
  allowedRoles,
  children,
}) => {
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#090b10] p-6 text-white text-center">
        <div className="max-w-md rounded-xl border border-red-800/40 bg-red-950/20 p-8">
          <h2 className="text-2xl font-bold text-red-500">Access Restricted</h2>
          <p className="mt-2 text-sm text-gray-400">
            You need <span className="font-semibold text-white uppercase">{allowedRoles.join(" or ")}</span> permissions to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};