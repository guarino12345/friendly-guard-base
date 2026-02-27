import { AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const checkLabels = {
  frontend: "Site Load",
  layout: "Layout",
  mobile: "Mobile",
  call_button: "Call Button",
  gtm_swap: "GTM Swap",
  form: "Form",
  plugins: "Plugins",
  theme: "Theme",
  wp_core: "WP Core",
  elementor: "Elementor",
  cron: "WP Cron",
  smtp: "SMTP",
  rest_api: "REST API",
};

export default function AlertLogTable({ alerts, onResolve }) {
  const active = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) => a.resolved);

  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-[#16161f] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#2a2a3a] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Alert Log</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">{active.length} active • {resolved.length} resolved</p>
        </div>
        {active.length > 0 && (
          <span className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            {active.length} issue{active.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
          <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-600/40" />
          <p className="text-sm">No alerts recorded</p>
        </div>
      ) : (
        <div className="divide-y divide-[#1e1e2a]">
          {[...active, ...resolved].map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${alert.resolved ? "opacity-40" : "hover:bg-white/[0.02]"}`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {alert.severity === "critical" ? (
                  <XCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-zinc-200">{alert.client_name || alert.domain}</span>
                  <span className="text-[10px] text-zinc-500 bg-[#111118] border border-[#1e1e2a] px-2 py-0.5 rounded-md">
                    {checkLabels[alert.check_name] || alert.check_name}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{alert.error_type}</p>
                {alert.message && <p className="text-[11px] text-zinc-600 mt-0.5">{alert.message}</p>}
              </div>
              <div className="flex-shrink-0 text-right flex flex-col items-end gap-1.5">
                <span className="text-[10px] text-zinc-600">
                  {new Date(alert.created_date).toLocaleString([], {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
                {!alert.resolved && (
                  <button
                    onClick={() => onResolve(alert.id)}
                    className="text-[10px] text-zinc-500 hover:text-emerald-400 border border-[#2a2a3a] hover:border-emerald-500/30 px-2 py-0.5 rounded-md transition-all"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}