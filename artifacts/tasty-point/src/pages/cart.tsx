import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { useCart, loadTableId, clearCart } from "@/lib/cart-store";
import { useCreateOrder, useCreatePaymentOrder, useVerifyPayment } from "@workspace/api-client-react";
import { VegBadge } from "@/components/VegBadge";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { items, updateQuantity, removeItem, clear, total, count } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cash">("razorpay");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createOrder = useCreateOrder();
  const createPaymentOrder = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();

  const tableId = loadTableId();

  const handleCheckout = async () => {
    if (!tableId) {
      toast({ title: "No table selected", description: "Please scan a QR code to select your table.", variant: "destructive" });
      return;
    }
    if (items.length === 0) return;

    setLoading(true);
    try {
      // 1. Create order
      const order = await createOrder.mutateAsync({
        data: {
          tableId,
          paymentMethod,
          notes: notes || undefined,
          items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity, notes: i.notes })),
        }
      });

      if (paymentMethod === "cash") {
        clearCart();
        setLocation(`/order-status/${order.id}`);
        return;
      }

      // 2. Razorpay flow
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast({ title: "Payment failed", description: "Could not load payment gateway", variant: "destructive" });
        setLoading(false);
        return;
      }

      const payOrder = await createPaymentOrder.mutateAsync({
        data: { amount: total, currency: "INR", orderId: order.id }
      });

      const rzp = new window.Razorpay({
        key: payOrder.keyId,
        amount: payOrder.amount,
        currency: payOrder.currency,
        order_id: payOrder.razorpayOrderId,
        name: "Tasty Point",
        description: `Order #${order.id} — Table ${tableId}`,
        theme: { color: "#C53030" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifyPayment.mutateAsync({
              data: {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: order.id,
              }
            });
            clearCart();
            setLocation(`/order-status/${order.id}`);
          } catch {
            toast({ title: "Payment verification failed", variant: "destructive" });
          }
        },
        modal: { ondismiss: () => setLoading(false) }
      });
      rzp.open();
    } catch {
      toast({ title: "Order failed", description: "Something went wrong. Please try again.", variant: "destructive" });
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <ShoppingBag size={64} className="text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Cart is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Add some delicious items from the menu</p>
          <button
            onClick={() => setLocation("/menu")}
            className="bg-primary text-white px-6 py-3 rounded-full font-semibold"
          >
            Browse Menu
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => setLocation("/menu")} className="p-2 hover:bg-gray-100 rounded-full" data-testid="back-btn">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">Your Cart</h1>
            <p className="text-xs text-gray-500">{count} item{count !== 1 ? "s" : ""}{tableId ? ` · Table ${tableId}` : ""}</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-4 pb-40">
        {/* Cart Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.menuItemId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 border-b last:border-b-0 border-gray-50"
              >
                <div className="flex gap-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-red-50 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <VegBadge isVeg={item.isVeg} />
                      <span className="font-semibold text-sm text-gray-900 truncate">{item.name}</span>
                    </div>
                    <p className="text-sm font-bold text-primary">₹{(item.price * item.quantity).toFixed(0)}</p>
                    <p className="text-xs text-gray-400">₹{item.price} each</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => removeItem(item.menuItemId)} className="text-gray-300 hover:text-red-500 transition-colors" data-testid={`remove-${item.menuItemId}`}>
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                      <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} className="text-gray-600" data-testid={`cart-minus-${item.menuItemId}`}>
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} className="text-gray-600" data-testid={`cart-plus-${item.menuItemId}`}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Order Notes</h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any special requests? (optional)"
            className="w-full text-sm bg-gray-50 rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-primary/20 border border-gray-100"
            rows={3}
            data-testid="order-notes"
          />
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Payment Method</h3>
          <div className="grid grid-cols-2 gap-2">
            {(["razorpay", "cash"] as const).map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${paymentMethod === method ? "border-primary bg-red-50 text-primary" : "border-gray-100 text-gray-600"}`}
                data-testid={`payment-${method}`}
              >
                {method === "razorpay" ? "Pay Online" : "Pay at Counter"}
              </button>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Bill Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({count} items)</span>
              <span>₹{total.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Taxes & Charges</span>
              <span className="text-green-600">Included</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
              <span>Total</span>
              <span>₹{total.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base shadow-lg hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            data-testid="place-order-btn"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
            {loading ? "Processing..." : `Place Order · ₹${total.toFixed(0)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
