import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Filter } from "lucide-react";
import AlertLogTable from "@/components/dashboard/AlertLogTable";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchAlerts = async () => {
    const data = await base44.entities.AlertLog.list("-created_date");
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id) => {
    await base44.entities.AlertLog.update(id, { resolved: true });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
  };

  const filtered = filter === "all" ? alerts : filter === "active" ? alerts.filter((a) => !a.resolved) : alerts.filter((a) => a.resolved);

  const filters = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Alert Log</h1>
          <p className="text-sm text-zinc-500 mt-1">All detected issues across monitored sites</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#16161f] border border-[#2a2a3a] rounded-xl p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.key ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-[#16161f] border border-[#2a2a3a] animate-pulse" />
      ) : (
        <AlertLogTable alerts={filtered} onResolve={handleResolve} />
      )}
    </div>
  );
}