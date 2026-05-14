import { useLocation, Link } from "wouter";
import { LayoutDashboard, UtensilsCrossed, Table2, ClipboardList, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/tables", label: "Tables", icon: Table2 },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <h1 className="font-serif text-xl font-bold text-primary">Tasty Point</h1>
          <p className="text-xs text-gray-500 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"}`}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <Link href="/menu" className="text-xs text-gray-400 hover:text-primary transition-colors">
            View Customer Menu →
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <h1 className="font-serif text-lg font-bold text-primary">Tasty Point Admin</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="md:hidden fixed inset-0 z-40 bg-white pt-16 px-4"
          >
            <nav className="space-y-1">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = location === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${active ? "bg-primary text-white" : "text-gray-600"}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
