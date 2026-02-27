import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function ActionButton({ action, site, onAction }) {
  const [state, setState] = useState("idle"); // idle | loading | done
  const Icon = action.icon;

  const handleClick = async () => {
    setState("loading");
    await onAction(site, action.key);
    setState("done");
    setTimeout(() => setState("idle"), 2500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200
        ${state === "done"
          ? "border-emerald-500/40 text-emerald-400 bg-emerald-400/10"
          : "border-[#2a2a3a] text-zinc-400 bg-[#111118] hover:border-zinc-600 hover:text-zinc-200 hover:bg-white/5 active:scale-95"
        }
        disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {state === "loading" ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : state === "done" ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      {state === "done" ? "Done" : action.label}
    </button>
  );
}