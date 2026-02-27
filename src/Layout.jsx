import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { label: "Dashboard", page: "Dashboard" },
    { label: "Alert Log", page: "Alerts" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-[#1e1e2a] bg-[#0a0a0f]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Friendly Guard™</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentPageName === item.page
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}