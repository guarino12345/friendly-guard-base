import { useState } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AddSiteModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ client_name: "", domain: "", wp_version: "", elementor_version: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.Site.create({ ...form, last_checked: new Date().toISOString() });
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#16161f] border border-[#2a2a3a] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a3a]">
          <h2 className="text-sm font-semibold text-white">Add New Site</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {[
            { key: "client_name", label: "Client Name", placeholder: "Acme Corp", required: true },
            { key: "domain", label: "Domain", placeholder: "acme.com", required: true },
            { key: "wp_version", label: "WP Version (optional)", placeholder: "6.4.2" },
            { key: "elementor_version", label: "Elementor Version (optional)", placeholder: "3.18.0" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wide mb-1.5 font-medium">{f.label}</label>
              <input
                type="text"
                required={f.required}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full bg-[#111118] border border-[#2a2a3a] rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2a3a] text-zinc-400 text-sm hover:text-zinc-200 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 disabled:opacity-50 transition-all"
            >
              {loading ? "Adding..." : "Add Site"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}