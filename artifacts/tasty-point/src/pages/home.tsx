import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { QrCode, LayoutDashboard, UtensilsCrossed } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex flex-col items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <UtensilsCrossed size={36} className="text-white" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">Tasty Point</h1>
        <p className="text-gray-500 mb-10 text-sm">Smart QR Restaurant Ordering Platform</p>
        <div className="space-y-3">
          <button
            onClick={() => setLocation("/menu")}
            className="w-full flex items-center gap-3 bg-primary text-white px-6 py-4 rounded-2xl font-semibold hover:bg-primary/90 transition-all shadow-md"
            data-testid="customer-menu-btn"
          >
            <QrCode size={20} />
            <span>Customer Menu</span>
          </button>
          <button
            onClick={() => setLocation("/admin")}
            className="w-full flex items-center gap-3 bg-white text-gray-700 border border-gray-200 px-6 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all"
            data-testid="admin-panel-btn"
          >
            <LayoutDashboard size={20} />
            <span>Admin Panel</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-8">Scan a table QR code to start ordering</p>
      </motion.div>
    </div>
  );
}
