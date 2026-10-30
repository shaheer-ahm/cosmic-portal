import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";
import { useAuth } from "./lib/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

const loadAuth = () => import("./pages/auth");
const loadResetPassword = () => import("./pages/resetPassword");
const loadDashboard = () => import("./pages/dashboard");
const loadOrders = () => import("./pages/orders");
const loadNewOrder = () => import("./pages/newOrders");
const loadResult = () => import("./pages/result");
const loadIntegration = () => import("./pages/integration");
const loadBoxDetail = () => import("./pages/boxDetail");
const loadProfiles = () => import("./pages/profiles");

const AuthPage = lazy(loadAuth);
const ResetPasswordPage = lazy(loadResetPassword);
const DashboardPage = lazy(loadDashboard);
const OrdersPage = lazy(loadOrders);
const NewOrderPage = lazy(loadNewOrder);
const ResultPage = lazy(loadResult);
const Integration = lazy(loadIntegration);
const BoxDetailRoute = lazy(loadBoxDetail);
const ProfileManagementPage = lazy(loadProfiles);

const isBoxDetailPath = (path: string) => /^\/orders\/[^/]+\/boxes\//.test(path);

// Start downloading the code for the page in the address bar straight away,
// in parallel with the login check, instead of waiting until React renders
// the route. (Calling the same import() again later reuses this download.)
function startCurrentPageDownload(path: string) {
    if (isBoxDetailPath(path)) void loadBoxDetail();
    else if (path === "/orders/new") void loadNewOrder();
    else if (/^\/(orders|results)\/[^/]+$/.test(path)) void loadResult();
    else if (path === "/orders") void loadOrders();
    else if (path === "/integration") void loadIntegration();
    else if (path === "/profiles") void loadProfiles();
    else if (path === "/reset-password") void loadResetPassword();
    else if (path === "/auth") void loadAuth();
    else void loadDashboard();
}
startCurrentPageDownload(window.location.pathname);

// After the first page has loaded, fetch the other portal pages' code in the
// background so moving between pages stays instant. The 3D visualizer is
// left out on purpose
function prefetchPortalPages() {
    if (isBoxDetailPath(window.location.pathname)) return;
    void loadDashboard();
    void loadOrders();
    void loadNewOrder();
    void loadResult();
    void loadIntegration();
    void loadProfiles();
}

function PageLoading() {
    return (
        <div className="grid min-h-screen place-items-center bg-[#f3f7fb] text-sm text-[#6a7f99]">
            Loading...
        </div>
    );
}

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

    const isLoggedIn = Boolean(session);

    useEffect(() => {
        if (!isLoggedIn) return;
        let timer: number | undefined;
        const start = () => {
            timer = window.setTimeout(prefetchPortalPages, 1500);
        };
        if (document.readyState === "complete") start();
        else window.addEventListener("load", start, { once: true });
        return () => {
            window.removeEventListener("load", start);
            if (timer !== undefined) window.clearTimeout(timer);
        };
    }, [isLoggedIn]);

    if (loading) {
        return <PageLoading />;
    }

    return (
        <Suspense fallback={<PageLoading />}>
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
                            <PageLoading />
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
        </Suspense>
    );
}