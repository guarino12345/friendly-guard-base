import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

export default function StatusBadge({ status, size = "sm" }) {
  const config = {
    pass: {
      label: "PASS",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10 border-emerald-400/20",
    },
    fail: {
      label: "FAIL",
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-400/10 border-red-400/20",
    },
    unknown: {
      label: "—",
      icon: HelpCircle,
      color: "text-zinc-500",
      bg: "bg-zinc-500/10 border-zinc-500/20",
    },
  };

  const cfg = config[status] || config.unknown;
  const Icon = cfg.icon;
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 border rounded-full font-semibold tracking-wide ${cfg.bg} ${cfg.color} ${
        isSmall ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      <Icon className={isSmall ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {cfg.label}
    </span>
  );
}