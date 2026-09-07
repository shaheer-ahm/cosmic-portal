import React, { useState } from 'react';
import { Globe, Activity, Eye, Database, RefreshCw } from 'lucide-react';
import { apiFetch } from "../lib/api";

// 1. Import AppShell from layout
import { AppShell } from "../components/layout/AppShell";

interface ServiceItem {
  name: string;
  latency: string;
  status: 'Connected' | 'Degraded' | 'Offline';
  icon: React.ElementType;
}

export const Integration: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>('https://api.cosmicfit.io');
  const [version, setVersion] = useState<string>('v2.4.1');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [healthResult, setHealthResult] = useState("");

  const handleHealthCheck = async (): Promise<void> => {
    setIsChecking(true);
    setHealthResult("");

    try {
      const data = await apiFetch<{ status: string }>("/health");

      setHealthResult(
        data.status === "ok"
          ? "Backend connected"
          : "Unexpected backend response",
      );
    } catch (error) {
      console.error(error);
      setHealthResult("Backend connection failed");
    } finally {
      setIsChecking(false);
    }
  };


  const services: ServiceItem[] = [
    { name: 'FitPortal API', latency: '42 ms', status: 'Connected', icon: Globe },
    { name: 'FitSolver', latency: '128 ms', status: 'Connected', icon: Activity },
    { name: 'FitVisualizer', latency: '890 ms', status: 'Degraded', icon: Eye },
    { name: 'MySQL', latency: '8 ms', status: 'Connected', icon: Database },
  ];

  return (
    // 2. Wrap the entire view in AppShell
    <AppShell>
      <div className="p-4 pb-24 font-sans max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
              CF
            </div>
            <div>
              <p className="text-[10px] tracking-widest text-gray-400 uppercase font-mono">COSMIC FIT</p>
              <h1 className="text-xl font-bold">Integration</h1>
            </div>
          </div>
          <span className="bg-[#1C1F26] border border-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Warehouse User
          </span>
        </div>

        {/* Services Section */}
        <div className="mb-6">
          <p className="text-[11px] font-mono tracking-wider text-gray-400 uppercase mb-3">SERVICES</p>
          <div className="space-y-3">
            {services.map((service, index) => {
              const Icon = service.icon;
              const isDegraded = service.status === 'Degraded';

              return (
                <div
                  key={index}
                  className="bg-[#1A1D24] border border-gray-800/80 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#242832] flex items-center justify-center text-indigo-400">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{service.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{service.latency}</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 ${
                      isDegraded
                        ? 'bg-amber-950/40 border border-amber-800/50 text-amber-400'
                        : 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDegraded ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    ></span>
                    {service.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* API Access Section */}
        <div>
          <p className="text-[11px] font-mono tracking-wider text-gray-400 uppercase mb-3">API ACCESS</p>
          <div className="bg-[#1A1D24] border border-gray-800/80 rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1.5">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full bg-[#12141a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1.5">Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-[#12141a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => window.open(`${baseUrl}/docs`, '_blank')}
                className="w-full bg-[#252a36] hover:bg-[#2d3342] text-indigo-300 font-medium text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Globe size={15} />
                Open API docs
              </button>

              <button
                type="button"
                onClick={handleHealthCheck}
                disabled={isChecking}
                className="w-full bg-[#161820] border border-gray-800 hover:border-gray-700 text-gray-300 font-medium text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={15} className={isChecking ? 'animate-spin text-indigo-400' : ''} />
                {isChecking ? 'Running check...' : 'Health check'}
              </button>
              {healthResult && (
                <p className="text-center text-xs text-gray-400">
                  {healthResult}
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