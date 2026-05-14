import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ChevronDown } from "lucide-react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey, ListOrdersStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { VegBadge } from "@/components/VegBadge";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["pending", "accepted", "preparing", "ready", "delivered"] as const;
type OrderStatus = typeof STATUSES[number];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-orange-100 text-orange-700 border-orange-200",
  ready: "bg-green-100 text-green-700 border-green-200",
  delivered: "bg-gray-100 text-gray-600 border-gray-200",
};

const NEXT_STATUS: Record<string, OrderStatus | null> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "delivered",
  delivered: null,
};

const NEXT_LABEL: Record<string, string> = {
  pending: "Accept",
  accepted: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Mark Delivered",
  delivered: "",
};

export default function AdminOrders() {
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listParams = filterStatus !== "all" ? { status: filterStatus as ListOrdersStatus } : undefined;

  const { data: orders = [], isLoading, refetch } = useListOrders(
    listParams,
    { query: { queryKey: getListOrdersQueryKey(listParams), refetchInterval: 10000 } }
  );

  const updateStatus = useUpdateOrderStatus();

  const handleStatusUpdate = async (orderId: number, status: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, data: { status } });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({}) });
      toast({ title: `Order #${orderId} updated to ${status}` });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track all orders in real-time</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            data-testid="refresh-orders"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {["all", ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as "all" | OrderStatus)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all border ${filterStatus === s ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200"}`}
              data-testid={`filter-${s}`}
            >
              {s === "all" ? "All Orders" : s}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-sm">No orders found</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order, i) => {
                const next = NEXT_STATUS[order.status];
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    data-testid={`order-card-${order.id}`}
                  >
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-gray-900">#{order.id}</span>
                        <span className="text-xs text-gray-400 ml-2">Table {order.tableNumber}</span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border capitalize ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2 mb-3">
                        {order.items?.slice(0, 3).map(item => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <VegBadge isVeg={item.menuItemImageUrl ? true : true} />
                            <span className="text-gray-700 flex-1 truncate">{item.menuItemName}</span>
                            <span className="text-gray-400 text-xs">×{item.quantity}</span>
                          </div>
                        ))}
                        {(order.items?.length ?? 0) > 3 && (
                          <p className="text-xs text-gray-400">+{(order.items?.length ?? 0) - 3} more items</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900">₹{order.totalAmount.toFixed(0)}</p>
                          <p className="text-xs text-gray-400 capitalize">{order.paymentMethod === "razorpay" ? "Online" : "Cash"} · {order.paymentStatus}</p>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      {next && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, next)}
                          disabled={updateStatus.isPending}
                          className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
                          data-testid={`action-btn-${order.id}`}
                        >
                          {NEXT_LABEL[order.status]}
                        </button>
                      )}
                    </div>
                    {order.notes && (
                      <div className="px-4 pb-4">
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">Note: {order.notes}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </AdminLayout>
  );
}
