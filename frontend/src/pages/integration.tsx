
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

import {
  Activity,
  Database,
  Eye,
  Globe,
  RefreshCw,
} from "lucide-react";

import { AppShell } from "../components/layout/AppShell";
import { PageHeader } from "../components/layout/PageHeader";
import { apiFetch } from "../lib/api";

interface IntegrationComponentStatus {
  configured: boolean;
  connected: boolean;
  detail: string;
  latency_ms?: number | null;
}

interface IntegrationStatusResponse {
  solver: IntegrationComponentStatus;
  supabase: IntegrationComponentStatus;
}

type ServiceStatus =
  | "Checking"
  | "Connected"
  | "Degraded"
  | "Offline"
  | "Not configured";

interface ServiceItem {
  key: "portal" | "solver" | "visualizer" | "supabase";
  name: string;
  detail: string;
  latencyMs: number | null;
  status: ServiceStatus;
  icon: React.ElementType;
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)?.replace(/\/$/, "");

const initialServices: ServiceItem[] = [
  {
    key: "portal",
    name: "FitPortal API",
    detail: "Waiting for health check",
    latencyMs: null,
    status: "Checking",
    icon: Globe,
  },
  {
    key: "solver",
    name: "FitSolver",
    detail: "Waiting for backend integration check",
    latencyMs: null,
    status: "Checking",
    icon: Activity,
  },
  {
    key: "visualizer",
    name: "FitVisualizer",
    detail: "Waiting for package check",
    latencyMs: null,
    status: "Checking",
    icon: Eye,
  },
  {
    key: "supabase",
    name: "Supabase",
    detail: "Waiting for database check",
    latencyMs: null,
    status: "Checking",
    icon: Database,
  },
];

const statusFromBackend = (
  component: IntegrationComponentStatus,
): ServiceStatus => {
  if (!component.configured) {
    return "Not configured";
  }

  return component.connected
    ? "Connected"
    : "Offline";
};

export const Integration: React.FC = () => {
  const reduceMotion = useReducedMotion();

  const [services, setServices] =
    useState<ServiceItem[]>(initialServices);

  const [isChecking, setIsChecking] = useState(false);
  const [version, setVersion] = useState("—");

  const [lastChecked, setLastChecked] =
    useState<Date | null>(null);

  const docsUrl = useMemo(() => {
    if (!API_BASE_URL) return null;

    return `${API_BASE_URL.replace(/\/api\/v1$/, "")}/docs`;
  }, []);

  const updateService = useCallback(
    (
      key: ServiceItem["key"],
      patch: Partial<ServiceItem>,
    ) => {
      setServices((current) =>
        current.map((service) =>
          service.key === key
            ? { ...service, ...patch }
            : service,
        ),
      );
    },
    [],
  );

  // Verify the FitVisualizer package
  const checkVisualizer = useCallback(async () => {
    const started = performance.now();

    try {
      const visualizer = await import(
        "@comp4050-fiv/visualizer"
      );

      const hasExpectedApi =
        typeof visualizer.BoxDetailPage ===
          "function" &&
        typeof visualizer.parsePackResponse ===
          "function" &&
        typeof visualizer.boxSlug ===
          "function";

      updateService("visualizer", {
        status: hasExpectedApi
          ? "Connected"
          : "Degraded",
        latencyMs: Math.round(
          performance.now() - started,
        ),
        detail: hasExpectedApi
          ? "Visualizer package loaded and expected integration API is available"
          : "Visualizer package loaded, but expected exports are missing",
      });
    } catch (error) {
      updateService("visualizer", {
        status: "Offline",
        latencyMs: Math.round(
          performance.now() - started,
        ),
        detail:
          error instanceof Error
            ? `Visualizer package could not load: ${error.message}`
            : "Visualizer package could not load",
      });
    }
  }, [updateService]);

  // Check backend, solver, visualizer and Supabase
  const handleHealthCheck =
    useCallback(async (): Promise<void> => {
      if (isChecking) return;

      setIsChecking(true);

      setServices((current) =>
        current.map((service) => ({
          ...service,
          status: "Checking",
          latencyMs: null,
        })),
      );

      const visualizerPromise = checkVisualizer();
      const portalStarted = performance.now();

      try {
        const health = await apiFetch<{
          status: string;
          service?: string;
          version?: string;
        }>("/health");

        const portalLatency = Math.round(
          performance.now() - portalStarted,
        );

        const portalConnected =
          health.status === "ok";

        updateService("portal", {
          status: portalConnected
            ? "Connected"
            : "Degraded",
          latencyMs: portalLatency,
          detail: portalConnected
            ? "Backend health endpoint responded successfully"
            : `Unexpected health response: ${health.status}`,
        });

        setVersion(health.version ?? "—");

        try {
          const integration =
            await apiFetch<IntegrationStatusResponse>(
              "/integration/status",
            );

          updateService("solver", {
            status: statusFromBackend(
              integration.solver,
            ),
            latencyMs:
              integration.solver.latency_ms ??
              null,
            detail: integration.solver.detail,
          });

          updateService("supabase", {
            status: statusFromBackend(
              integration.supabase,
            ),
            latencyMs:
              integration.supabase.latency_ms ??
              null,
            detail: integration.supabase.detail,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Integration status request failed";

          updateService("solver", {
            status: "Offline",
            detail: message,
          });

          updateService("supabase", {
            status: "Offline",
            detail: message,
          });
        }
      } catch (error) {
        const portalLatency = Math.round(
          performance.now() - portalStarted,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Backend connection failed";

        updateService("portal", {
          status: "Offline",
          latencyMs: portalLatency,
          detail: message,
        });

        updateService("solver", {
          status: "Offline",
          detail:
            "Cannot check FitSolver while FitPortal API is unreachable",
        });

        updateService("supabase", {
          status: "Offline",
          detail:
            "Cannot check Supabase while FitPortal API is unreachable",
        });

        setVersion("—");
      } finally {
        await visualizerPromise;

        setLastChecked(new Date());
        setIsChecking(false);
      }
    }, [
      checkVisualizer,
      isChecking,
      updateService,
    ]);

  // Initial health check on page load
  useEffect(() => {
    void handleHealthCheck();

    // Run once on page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusClasses = (
    status: ServiceStatus,
  ) => {
    if (status === "Connected") {
      return "bg-[#e8f8ee] border-[#c3e8d1] text-[#14784f]";
    }

    if (
      status === "Degraded" ||
      status === "Checking"
    ) {
      return "bg-[#fff5e5] border-[#f4dbb0] text-[#a76c14]";
    }

    return "bg-[#fff0ed] border-[#f1d1cc] text-[#b64641]";
  };

  const dotClasses = (
    status: ServiceStatus,
  ) => {
    if (status === "Connected") {
      return "bg-emerald-400";
    }

    if (
      status === "Degraded" ||
      status === "Checking"
    ) {
      return "bg-amber-400";
    }

    return "bg-red-400";
  };

  return (
    <AppShell>
      {/* Shared header matching Orders page */}
      <PageHeader
        title="Integration"
        backTo="/dashboard"
      />

      <main className="cf-page cf-integration">
        {/* Service status section */}
        <div className="mb-6">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-[#72859d]">
            Services
          </p>

          <div className="space-y-3 cf-service-grid">
            {services.map((service, index) => {
              const Icon = service.icon;

              return (
                <motion.div
                  key={service.key}
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 16,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: reduceMotion
                      ? 0
                      : 0.35,
                    delay: reduceMotion
                      ? 0
                      : index * 0.08,
                    ease: "easeOut",
                  }}
                  className="rounded-2xl border border-[#e1e8f1] bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Service icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ff] text-[#227cbd]">
                        <Icon size={20} />
                      </div>

                      {/* Service name and latency */}
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">
                          {service.name}
                        </h3>

                        <p className="font-mono text-xs text-[#8193a7]">
                          {service.latencyMs ===
                          null
                            ? "—"
                            : `${service.latencyMs} ms`}
                        </p>
                      </div>
                    </div>

                    {/* Animated status badge */}
                    <AnimatePresence
                      mode="wait"
                      initial={false}
                    >
                      <motion.span
                        key={`${service.key}-${service.status}`}
                        initial={
                          reduceMotion
                            ? false
                            : {
                                opacity: 0,
                                scale: 0.9,
                                y: 5,
                              }
                        }
                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: 0,
                        }}
                        exit={
                          reduceMotion
                            ? {
                                opacity: 0,
                              }
                            : {
                                opacity: 0,
                                scale: 0.95,
                                y: -3,
                              }
                        }
                        transition={{
                          duration: reduceMotion
                            ? 0
                            : 0.18,
                          ease: "easeOut",
                        }}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(
                          service.status,
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${dotClasses(
                            service.status,
                          )}`}
                        />

                        {service.status}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  {/* Service details */}
                  <p className="mt-3 text-xs leading-5 text-[#8193a7]">
                    {service.detail}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* API Access */}
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-[#72859d]">
            API Access
          </p>

          <div className="space-y-4 rounded-2xl border border-[#e1e8f1] bg-white p-4">
            {/* API Base URL */}
            <div>
              <label className="mb-1.5 block font-mono text-xs text-[#72859d]">
                Base URL
              </label>

              <div className="w-full break-all rounded-xl border border-[#e1e8f1] bg-[#f8fbff] px-3.5 py-2.5 font-mono text-xs text-[#344e6a]">
                {API_BASE_URL ??
                  "VITE_API_BASE_URL is not configured"}
              </div>
            </div>

            {/* API Version */}
            <div>
              <label className="mb-1.5 block font-mono text-xs text-[#72859d]">
                API Version
              </label>

              <div className="w-full rounded-xl border border-[#e1e8f1] bg-[#f8fbff] px-3.5 py-2.5 font-mono text-xs text-[#344e6a]">
                {version}
              </div>
            </div>

            {/* API action buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={!docsUrl}
                onClick={() =>
                  docsUrl &&
                  window.open(
                    docsUrl,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#eef5fb] py-3 text-xs font-medium text-[#247fc5] transition-colors hover:bg-[#e7f2fd] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Globe size={15} />
                Open API docs
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleHealthCheck()
                }
                disabled={isChecking}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e1e8f1] bg-white py-3 text-xs font-medium text-[#49637e] transition-colors hover:border-[#dce5ee] disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={
                    isChecking && !reduceMotion
                      ? "animate-spin text-[#227cbd]"
                      : ""
                  }
                />

                {isChecking
                  ? "Running checks..."
                  : "Run health checks"}
              </button>

              {/* Last check timestamp */}
              {lastChecked && (
                <p className="text-center text-[11px] text-[#8193a7]">
                  Last checked{" "}
                  {lastChecked.toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    },
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
};

export default Integration;
