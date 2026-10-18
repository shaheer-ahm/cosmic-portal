import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";
import { useAuth } from "./lib/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

import AuthPage from "./pages/auth";
import ResetPasswordPage from "./pages/resetPassword";
import DashboardPage from "./pages/dashboard";
import { OrdersPage } from "./pages/orders";
import NewOrderPage from "./pages/newOrders";
import ResultPage from "./pages/result";
import Integration from "./pages/integration";
import BoxDetailRoute from "./pages/boxDetail";
import ProfileManagementPage from "./pages/profiles";

export default function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const { role, loading: roleLoading } = useAuth();

    useEffect(() => {
        const loadSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            setSession(session);
            setLoading(false);
        };

        loadSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#090b10] text-white">
                Loading...
            </div>
        );
    }

    return (
        <Routes>
            {/* Root */}
            <Route
                path="/"
                element={
                    <Navigate to={session ? "/dashboard" : "/auth"} replace />
                }
            />

            {/* Authentication */}
            <Route
                path="/auth"
                element={
                    session ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <AuthPage />
                    )
                }
            />

            {/* Password reset */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected portal pages */}
            <Route
                path="/dashboard"
                element={
                    session ? (
                        <DashboardPage />
                    ) : (
                        <Navigate to="/auth" replace />
                    )
                }
            />

            <Route
                path="/orders"
                element={
                    session ? <OrdersPage /> : <Navigate to="/auth" replace />
                }
            />

            <Route
                path="/orders/new"
                element={
                    session ? <NewOrderPage /> : <Navigate to="/auth" replace />
                }
            />

            <Route
                path="/orders/:orderId"
                element={
                    session ? <ResultPage /> : <Navigate to="/auth" replace />
                }
            />

            <Route
                path="/results/:orderId"
                element={
                    session ? <ResultPage /> : <Navigate to="/auth" replace />
                }
            />

            <Route
                path="/integration"
                element={
                    session ? <Integration /> : <Navigate to="/auth" replace />
                }
            />

            {/* Supervisor-only: user / role management */}
            <Route
                path="/profiles"
                element={
                    roleLoading ? (
                        <div className="grid min-h-screen place-items-center bg-[#090b10] text-white">
                            Loading...
                        </div>
                    ) : (
                        <ProtectedRoute
                            session={session}
                            userRole={role}
                            allowedRoles={["supervisor"]}
                        >
                            <ProfileManagementPage />
                        </ProtectedRoute>
                    )
                }
            />

            {/* Unknown routes */}
            <Route
                path="*"
                element={
                    <Navigate to={session ? "/dashboard" : "/auth"} replace />
                }
            />

            {/* visualizer */}
            <Route
                path="/orders/:orderId/boxes/:boxSlug"
                element={
                    session ? (
                        <BoxDetailRoute />
                    ) : (
                        <Navigate to="/auth" replace />
                    )
                }
            />
        </Routes>
    );
}