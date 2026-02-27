import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp, Zap, RefreshCw, Trash2, RotateCcw, Power } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ActionButton from "./ActionButton";

const checks = [
  { key: "frontend_status", label: "Site Load" },
  { key: "layout_status", label: "Layout" },
  { key: "mobile_status", label: "Mobile" },
  { key: "call_button_status", label: "Call Button" },
  { key: "gtm_swap_status", label: "GTM Swap" },
  { key: "form_status", label: "Form" },
  { key: "plugins_status", label: "Plugins" },
  { key: "theme_status", label: "Theme" },
  { key: "wp_core_status", label: "WP Core" },
  { key: "elementor_status", label: "Elementor" },
  { key: "cron_status", label: "WP Cron" },
  { key: "smtp_status", label: "SMTP" },
  { key: "rest_api_status", label: "REST API" },
];

const actions = [
  { key: "clear-elementor-cache", label: "Clear Elementor Cache", icon: Zap },
  { key: "regenerate-css", label: "Regenerate CSS", icon: RefreshCw },
  { key: "flush-permalinks", label: "Flush Permalinks", icon: RotateCcw },
  { key: "restart-cron", label: "Restart WP Cron", icon: Power },
  { key: "disable-plugin", label: "Disable Plugin", icon: Trash2 },
];

function getOverallStatus(site) {
  const statuses = checks.map((c) => site[c.key]);
  if (statuses.some((s) => s === "fail")) return "critical";
  if (statuses.every((s) => s === "unknown")) return "unknown";
  return "healthy";
}

export default function SiteCard({ site, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const overall = getOverallStatus(site);

  const passCount = checks.filter((c) => site[c.key] === "pass").length;
  const failCount = checks.filter((c) => site[c.key] === "fail").length;

  const statusRing = {
    healthy: "border-emerald-500/30 shadow-emerald-500/5",
    critical: "border-red-500/30 shadow-red-500/5",
    unknown: "border-zinc-700/30",
  }[overall];

  const statusDot = {
    healthy: "bg-emerald-400",
    critical: "bg-red-400 animate-pulse",
    unknown: "bg-zinc-500",
  }[overall];

  return (
    <div
      className={`rounded-2xl border bg-[#16161f] shadow-xl transition-all duration-300 ${statusRing}`}
      style={{ boxShadow: overall === "critical" ? "0 0 30px rgba(255,61,113,0.06)" : overall === "healthy" ? "0 0 30px rgba(0,230,118,0.04)" : "none" }}
    >
      {/* Header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot}`} />
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-white truncate">{site.client_name}</h3>
            <a
              href={`https://${site.domain}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5"
            >
              {site.domain}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[11px] text-emerald-400 font-medium">{passCount} pass</span>
              {failCount > 0 && <span className="text-[11px] text-red-400 font-medium">{failCount} fail</span>}
            </div>
            {site.last_checked && (
              <p className="text-[10px] text-zinc-600 mt-0.5">
                {new Date(site.last_checked).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Check Grid Preview */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-13 gap-1.5">
          {checks.map((check) => (
            <div key={check.key} className="flex flex-col items-center gap-1">
              <StatusBadge status={site[check.key] || "unknown"} size="sm" />
              <span className="text-[9px] text-zinc-600 text-center leading-tight">{check.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded: Details + Actions */}
      {expanded && (
        <div className="border-t border-[#2a2a3a] px-5 py-4 space-y-5">
          {/* Full check table */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {checks.map((check) => (
              <div key={check.key} className="flex items-center justify-between bg-[#111118] rounded-xl px-3 py-2.5 border border-[#1e1e2a]">
                <span className="text-xs text-zinc-400">{check.label}</span>
                <StatusBadge status={site[check.key] || "unknown"} size="md" />
              </div>
            ))}
          </div>

          {/* Meta */}
          {(site.wp_version || site.elementor_version) && (
            <div className="flex gap-3 flex-wrap">
              {site.wp_version && (
                <span className="text-[11px] text-zinc-500 bg-[#111118] border border-[#1e1e2a] rounded-lg px-2.5 py-1">
                  WP {site.wp_version}
                </span>
              )}
              {site.elementor_version && (
                <span className="text-[11px] text-zinc-500 bg-[#111118] border border-[#1e1e2a] rounded-lg px-2.5 py-1">
                  Elementor {site.elementor_version}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2.5 font-medium">Manual Repair</p>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <ActionButton key={action.key} action={action} site={site} onAction={onAction} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}