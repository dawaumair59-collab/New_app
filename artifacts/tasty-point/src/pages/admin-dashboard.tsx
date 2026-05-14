import { motion } from "framer-motion";
import { TrendingUp, ShoppingBag, Clock, CheckCircle, Table2, UtensilsCrossed } from "lucide-react";
import { useGetDashboardSummary, useGetBestSellers, useGetRecentOrders, useGetTablePerformance } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { VegBadge } from "@/components/VegBadge";

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  ready: "bg-green-100 text-green-700",
  delivered: "bg-gray-100 text-gray-600",
};

export default function AdminDashboard() {
  const { data: summary, isLoading: sumLoading } = useGetDashboardSummary();
  const { data: bestSellers = [], isLoading: bsLoading } = useGetBestSellers({ limit: 5 });
  const { data: recentOrders = [], isLoading: roLoading } = useGetRecentOrders({ limit: 8 });
  const { data: tablePerf = [] } = useGetTablePerformance();

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back — here's what's happening today</p>
        </div>

        {/* Stats Grid */}
        {sumLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Today's Revenue" value={`₹${summary.todayRevenue.toFixed(0)}`} sub={`${summary.todayOrders} orders today`} icon={TrendingUp} color="bg-primary/10 text-primary" />
            <StatCard label="Total Revenue" value={`₹${summary.totalRevenue.toFixed(0)}`} sub={`${summary.totalOrders} total orders`} icon={ShoppingBag} color="bg-blue-50 text-blue-600" />
            <StatCard label="Pending Orders" value={String(summary.pendingOrders)} sub="Awaiting acceptance" icon={Clock} color="bg-amber-50 text-amber-600" />
            <StatCard label="Active Orders" value={String(summary.activeOrders)} sub="Being prepared" icon={CheckCircle} color="bg-green-50 text-green-600" />
            <StatCard label="Total Tables" value={String(summary.totalTables)} icon={Table2} color="bg-purple-50 text-purple-600" />
            <StatCard label="Menu Items" value={String(summary.totalMenuItems)} sub="Available items" icon={UtensilsCrossed} color="bg-rose-50 text-rose-600" />
          </div>
        ) : null}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {roLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 mx-5 my-2 rounded-xl" />)
              ) : recentOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
              ) : (
                recentOrders.map(order => (
                  <div key={order.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">#{order.id}</span>
                        <span className="text-xs text-gray-400">Table {order.tableNumber}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{order.items?.map(i => i.menuItemName).join(", ")}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-gray-900">₹{order.totalAmount.toFixed(0)}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Best Sellers */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Best Sellers</h2>
            </div>
            <div className="p-5 space-y-4">
              {bsLoading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)
              ) : bestSellers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
              ) : (
                bestSellers.map((item, i) => (
                  <div key={item.menuItemId} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                    <VegBadge isVeg={item.isVeg ?? true} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.menuItemName}</p>
                      <p className="text-xs text-gray-400">{item.totalQuantity} sold</p>
                    </div>
                    <p className="text-sm font-bold text-primary">₹{item.totalRevenue.toFixed(0)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Table Performance */}
        {tablePerf.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Table Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Table</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">Orders</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">Revenue</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">Avg Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tablePerf.map(t => (
                    <tr key={t.tableId}>
                      <td className="px-5 py-3 font-medium text-gray-900">Table {t.tableNumber}{t.tableName ? ` — ${t.tableName}` : ""}</td>
                      <td className="px-5 py-3 text-right text-gray-600">{t.totalOrders}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">₹{t.totalRevenue.toFixed(0)}</td>
                      <td className="px-5 py-3 text-right text-gray-500">₹{(t.averageOrderValue ?? 0).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
