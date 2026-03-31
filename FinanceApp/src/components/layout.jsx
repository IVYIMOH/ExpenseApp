import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Receipt, Target, BarChart2, TrendingUp, Menu, GraduationCap, X, Leaf } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/budget', label: 'Budget', icon: Target },
  { path: '/reports', label: 'Reports', icon: BarChart2 },
  { path: '/market', label: 'Market', icon: TrendingUp },
  { path: '/learning', label: 'Learning', icon: GraduationCap },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background font-inter overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col transition-transform duration-300 shadow-2xl",
        "lg:relative lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo area */}
        <div className="px-5 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center shadow-lg">
              <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sidebar-foreground font-bold text-base leading-tight tracking-tight">OkoaPesa</h1>
              <p className="text-sidebar-foreground/45 text-[11px] font-medium tracking-wide uppercase">Study. Invest. Grow.</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="text-sidebar-foreground/30 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">Menu</p>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "opacity-100" : "opacity-60")} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sidebar-border">
          <p className="text-sidebar-foreground/30 text-xs">© 2026 OkoaPesa</p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">OkoaPesa</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}