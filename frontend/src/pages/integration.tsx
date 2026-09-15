import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Database,
  Eye,
  Globe,
  RefreshCw,
} from "lucide-react";

import { AppShell } from "../components/layout/AppShell";
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
  /\/$/,
  "",
);

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
  if (!component.configured) return "Not configured";
  return component.connected ? "Connected" : "Offline";
};

export const Integration: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [isChecking, setIsChecking] = useState(false);
  const [version, setVersion] = useState("—");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const docsUrl = useMemo(() => {
    if (!API_BASE_URL) return null;
    return `${API_BASE_URL.replace(/\/api\/v1$/, "")}/docs`;
  }, []);

  const updateService = useCallback(
    (key: ServiceItem["key"], patch: Partial<ServiceItem>) => {
      setServices((current) =>
        current.map((service) =>
          service.key === key ? { ...service, ...patch } : service,
        ),
      );
    },
    [],
  );

  const checkVisualizer = useCallback(async () => {
    const started = performance.now();

    try {
      const visualizer = await import("@comp4050-fiv/visualizer");
      const hasExpectedApi =
        typeof visualizer.BoxDetailPage === "function" &&
        typeof visualizer.parsePackResponse === "function" &&
        typeof visualizer.boxSlug === "function";

      updateService("visualizer", {
        status: hasExpectedApi ? "Connected" : "Degraded",
        latencyMs: Math.round(performance.now() - started),
        detail: hasExpectedApi
          ? "Visualizer package loaded and expected integration API is available"
          : "Visualizer package loaded, but expected exports are missing",
      });
    } catch (error) {
      updateService("visualizer", {
        status: "Offline",
        latencyMs: Math.round(performance.now() - started),
        detail:
          error instanceof Error
            ? `Visualizer package could not load: ${error.message}`
            : "Visualizer package could not load",
      });
    }
  }, [updateService]);

  const handleHealthCheck = useCallback(async (): Promise<void> => {
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

      const portalLatency = Math.round(performance.now() - portalStarted);
      const portalConnected = health.status === "ok";

      updateService("portal", {
        status: portalConnected ? "Connected" : "Degraded",
        latencyMs: portalLatency,
        detail: portalConnected
          ? "Backend health endpoint responded successfully"
          : `Unexpected health response: ${health.status}`,
      });

      setVersion(health.version ?? "—");

      try {
        const integration = await apiFetch<IntegrationStatusResponse>(
          "/integration/status",
        );

        updateService("solver", {
          status: statusFromBackend(integration.solver),
          latencyMs: integration.solver.latency_ms ?? null,
          detail: integration.solver.detail,
        });

        updateService("supabase", {
          status: statusFromBackend(integration.supabase),
          latencyMs: integration.supabase.latency_ms ?? null,
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
      const portalLatency = Math.round(performance.now() - portalStarted);
      const message =
        error instanceof Error ? error.message : "Backend connection failed";

      updateService("portal", {
        status: "Offline",
        latencyMs: portalLatency,
        detail: message,
      });
      updateService("solver", {
        status: "Offline",
        detail: "Cannot check FitSolver while FitPortal API is unreachable",
      });
      updateService("supabase", {
        status: "Offline",
        detail: "Cannot check Supabase while FitPortal API is unreachable",
      });
      setVersion("—");
    } finally {
      await visualizerPromise;
      setLastChecked(new Date());
      setIsChecking(false);
    }
  }, [checkVisualizer, isChecking, updateService]);

  useEffect(() => {
    void handleHealthCheck();
    // Run once when the page opens; the button can be used for subsequent checks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusClasses = (status: ServiceStatus) => {
    if (status === "Connected") {
      return "bg-emerald-950/40 border-emerald-800/50 text-emerald-400";
    }
    if (status === "Degraded" || status === "Checking") {
      return "bg-amber-950/40 border-amber-800/50 text-amber-400";
    }
    return "bg-red-950/40 border-red-800/50 text-red-400";
  };

  const dotClasses = (status: ServiceStatus) => {
    if (status === "Connected") return "bg-emerald-400";
    if (status === "Degraded" || status === "Checking") return "bg-amber-400";
    return "bg-red-400";
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-md p-4 pb-24 font-sans">
        <div className="mb-6 flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold">
              CF
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                COSMIC FIT
              </p>
              <h1 className="text-xl font-bold">Integration</h1>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-gray-400">
            Services
          </p>
          <div className="space-y-3">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <div
                  key={service.key}
                  className="rounded-2xl border border-gray-800/80 bg-[#1A1D24] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#242832] text-indigo-400">
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">{service.name}</h3>
                        <p className="font-mono text-xs text-gray-500">
                          {service.latencyMs === null
                            ? "—"
                            : `${service.latencyMs} ms`}
                        </p>
                      </div>
                    </div>

                    <span
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
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    {service.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-gray-400">
            API Access
          </p>
          <div className="space-y-4 rounded-2xl border border-gray-800/80 bg-[#1A1D24] p-4">
            <div>
              <label className="mb-1.5 block font-mono text-xs text-gray-400">
                Base URL
              </label>
              <div className="w-full break-all rounded-xl border border-gray-800 bg-[#12141a] px-3.5 py-2.5 font-mono text-xs text-gray-200">
                {API_BASE_URL ?? "VITE_API_BASE_URL is not configured"}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs text-gray-400">
                API Version
              </label>
              <div className="w-full rounded-xl border border-gray-800 bg-[#12141a] px-3.5 py-2.5 font-mono text-xs text-gray-200">
                {version}
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={!docsUrl}
                onClick={() => docsUrl && window.open(docsUrl, "_blank")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#252a36] py-3 text-xs font-medium text-indigo-300 transition-colors hover:bg-[#2d3342] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Globe size={15} />
                Open API docs
              </button>

              <button
                type="button"
                onClick={() => void handleHealthCheck()}
                disabled={isChecking}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-800 bg-[#161820] py-3 text-xs font-medium text-gray-300 transition-colors hover:border-gray-700 disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={isChecking ? "animate-spin text-indigo-400" : ""}
                />
                {isChecking ? "Running checks..." : "Run health checks"}
              </button>

              {lastChecked && (
                <p className="text-center text-[11px] text-gray-500">
                  Last checked {lastChecked.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Integration;
