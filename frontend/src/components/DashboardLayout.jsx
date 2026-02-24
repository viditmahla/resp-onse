import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, FlaskConical, BarChart3, GitCompare, Database, MessageCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/simulator", icon: FlaskConical, label: "Simulator" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/comparison", icon: GitCompare, label: "Comparison" },
  { to: "/data", icon: Database, label: "Data" },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white" data-testid="dashboard-layout">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-slate-200 bg-slate-50/50 transition-all duration-200 ${collapsed ? "w-16" : "w-56"}`}
        data-testid="sidebar"
      >
        <div className={`flex items-center h-14 border-b border-slate-200 px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm text-slate-900 tracking-tight" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                ERW India
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            data-testid="sidebar-toggle"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                } ${collapsed ? "justify-center" : ""}`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-200">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            data-testid="chat-toggle"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium w-full transition-all duration-150 ${
              chatOpen ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <MessageCircle className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>AI Assistant</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white" data-testid="topbar">
          <h1 className="text-lg font-semibold text-slate-900" style={{ fontFamily: "'Work Sans', sans-serif" }}>
            Enhanced Rock Weathering Simulator
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Indian Rivers CDR Analysis</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50/30 relative">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Chat Widget */}
      {chatOpen && (
        <div className="fixed bottom-0 right-0 w-96 h-[520px] z-50 shadow-2xl border border-slate-200 rounded-tl-xl bg-white flex flex-col" data-testid="chat-widget">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-slate-900">ERW AI Assistant</span>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-700" data-testid="chat-close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ChatWidget />
        </div>
      )}
    </div>
  );
}
