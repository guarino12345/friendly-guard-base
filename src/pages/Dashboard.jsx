import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, RefreshCw } from "lucide-react";
import SiteCard from "@/components/dashboard/SiteCard";
import StatsBar from "@/components/dashboard/StatsBar";
import AddSiteModal from "@/components/dashboard/AddSiteModal";

export default function Dashboard() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSites = async () => {
    const data = await base44.entities.Site.list("-last_checked");
    setSites(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSites();
    setRefreshing(false);
  };

  const handleAction = async (site, actionKey) => {
    // In a real setup this would call the WP plugin REST endpoint via a backend function
    // For now we log the action and could later wire up backend function
    console.log(`Action: ${actionKey} on ${site.domain}`);
    await new Promise((r) => setTimeout(r, 1200)); // Simulate network call
  };

  const filtered = sites.filter(
    (s) =>
      s.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.domain?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Site Monitor</h1>
          <p className="text-sm text-zinc-500 mt-1">WordPress client health at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-xl border border-[#2a2a3a] text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all ${refreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-xl hover:bg-zinc-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Site
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar sites={sites} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          type="text"
          placeholder="Search by client or domain…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#16161f] border border-[#2a2a3a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Site Cards */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#16161f] border border-[#2a2a3a] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium">
            {sites.length === 0 ? "No sites added yet" : "No sites match your search"}
          </p>
          {sites.length === 0 && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 text-xs text-zinc-500 hover:text-white border border-[#2a2a3a] hover:border-zinc-600 px-4 py-2 rounded-xl transition-all"
            >
              + Add your first site
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((site) => (
            <SiteCard key={site.id} site={site} onAction={handleAction} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddSiteModal onClose={() => setShowAdd(false)} onAdded={fetchSites} />
      )}
    </div>
  );
}