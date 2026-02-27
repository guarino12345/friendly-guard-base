import { Globe, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export default function StatsBar({ sites }) {
  const total = sites.length;
  const healthy = sites.filter((s) => {
    return !["frontend_status","layout_status","mobile_status","call_button_status","gtm_swap_status","form_status","plugins_status","theme_status","wp_core_status","elementor_status","cron_status","smtp_status","rest_api_status"].some((k) => s[k] === "fail");
  }).length;
  const critical = sites.filter((s) =>
    ["frontend_status","layout_status","mobile_status","call_button_status","gtm_swap_status","form_status","plugins_status","theme_status","wp_core_status","elementor_status","cron_status","smtp_status","rest_api_status"].some((k) => s[k] === "fail")
  ).length;
  const unknown = sites.filter((s) =>
    ["frontend_status","layout_status","mobile_status","call_button_status","gtm_swap_status","form_status","plugins_status","theme_status","wp_core_status","elementor_status","cron_status","smtp_status","rest_api_status"].every((k) => !s[k] || s[k] === "unknown")
  ).length;

  const stats = [
    { label: "Total Sites", value: total, icon: Globe, color: "text-zinc-400", bg: "bg-zinc-400/10" },
    { label: "Healthy", value: healthy, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Issues", value: critical, icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" },
    { label: "Pending", value: unknown, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="rounded-2xl border border-[#2a2a3a] bg-[#16161f] px-4 py-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-zinc-500">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}