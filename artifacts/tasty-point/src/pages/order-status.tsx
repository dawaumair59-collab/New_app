import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ChefHat, BellRing, Package, ArrowLeft } from "lucide-react";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STATUSES = [
  { key: "pending", label: "Order Placed", icon: Clock, desc: "We received your order" },
  { key: "accepted", label: "Accepted", icon: CheckCircle2, desc: "Restaurant confirmed your order" },
  { key: "preparing", label: "Preparing", icon: ChefHat, desc: "Chef is preparing your food" },
  { key: "ready", label: "Ready", icon: BellRing, desc: "Your order is ready!" },
  { key: "delivered", label: "Delivered", icon: Package, desc: "Enjoy your meal!" },
];

export default function OrderStatusPage() {
  const [, params] = useRoute("/order-status/:id");
  const [, setLocation] = useLocation();
  const orderId = Number(params?.id);
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId, queryKey: getGetOrderQueryKey(orderId), refetchInterval: 5000 }
  });

  // Poll every 5s for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
    }, 5000);
    return () => clearInterval(interval);
  }, [orderId, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const currentIdx = STATUSES.findIndex(s => s.key === order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white px-4 pt-12 pb-8">
        <div className="max-w-xl mx-auto">
          <button onClick={() => setLocation("/menu")} className="flex items-center gap-1 text-white/80 text-sm mb-4" data-testid="back-menu">
            <ArrowLeft size={16} /> Back to Menu
          </button>
          <h1 className="font-serif text-2xl font-bold mb-1">Order #{order.id}</h1>
          <p className="text-white/80 text-sm">Table {order.tableNumber} · {new Date(order.createdAt).toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Status Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-5">Order Status</h2>
          <div className="space-y-0">
            {STATUSES.map((step, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: active ? 1.1 : 1 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${done ? "bg-primary text-white" : "bg-gray-100 text-gray-300"} ${active ? "ring-4 ring-primary/20" : ""}`}
                    >
                      <Icon size={18} />
                    </motion.div>
                    {i < STATUSES.length - 1 && (
                      <div className={`w-0.5 h-8 my-1 transition-colors ${i < currentIdx ? "bg-primary" : "bg-gray-100"}`} />
                    )}
                  </div>
                  <div className="pt-2 pb-8 last:pb-0">
                    <p className={`font-semibold text-sm ${done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                    {active && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-primary mt-0.5">{step.desc}</motion.p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Your Items</h2>
          <div className="space-y-3">
            {order.items?.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                {item.menuItemImageUrl ? (
                  <img src={item.menuItemImageUrl} alt={item.menuItemName} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-red-50" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.menuItemName}</p>
                  <p className="text-xs text-gray-400">x{item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">₹{item.totalPrice.toFixed(0)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>₹{order.totalAmount.toFixed(0)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Payment Method</span>
            <span className="font-semibold capitalize">{order.paymentMethod === "razorpay" ? "Online Payment" : "Pay at Counter"}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-500">Payment Status</span>
            <span className={`font-semibold capitalize ${order.paymentStatus === "paid" ? "text-green-600" : order.paymentStatus === "failed" ? "text-red-600" : "text-amber-600"}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
