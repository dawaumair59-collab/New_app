import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, X, ChevronRight } from "lucide-react";
import { useListMenuItems, useListCategories } from "@workspace/api-client-react";
import { FoodCard } from "@/components/FoodCard";
import { useCart, loadTableId, saveTableId } from "@/lib/cart-store";
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [vegFilter, setVegFilter] = useState<boolean | null>(null);
  const [tableId, setTableId] = useState<number | null>(null);

  const { items: cartItems, total, count } = useCart();

  // Read table from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("table");
    if (t) {
      const n = Number(t);
      setTableId(n);
      saveTableId(n);
    } else {
      setTableId(loadTableId());
    }
  }, []);

  const { data: categories = [], isLoading: catsLoading } = useListCategories();
  const { data: menuItems = [], isLoading: itemsLoading } = useListMenuItems(
    { categoryId: selectedCategory ?? undefined, search: search || undefined, isVeg: vegFilter ?? undefined, isAvailable: true },
    { query: { queryKey: ["listMenuItems", selectedCategory, search, vegFilter] } }
  );

  const debounced = useCallback((fn: (v: string) => void, delay: number) => {
    let t: ReturnType<typeof setTimeout>;
    return (v: string) => { clearTimeout(t); t = setTimeout(() => fn(v), delay); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-serif text-xl font-bold text-gray-900">Tasty Point</h1>
              {tableId && (
                <p className="text-xs text-gray-500">Table {tableId}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {vegFilter !== null && (
                <button
                  onClick={() => setVegFilter(null)}
                  className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full"
                >
                  {vegFilter ? "Veg" : "Non-Veg"} <X size={10} />
                </button>
              )}
              <button
                onClick={() => setVegFilter(v => v === true ? null : true)}
                className={`px-2 py-1 rounded-full border text-[11px] font-medium transition-colors ${vegFilter === true ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600"}`}
                data-testid="filter-veg"
              >
                Veg
              </button>
              <button
                onClick={() => setVegFilter(v => v === false ? null : false)}
                className={`px-2 py-1 rounded-full border text-[11px] font-medium transition-colors ${vegFilter === false ? "bg-red-600 text-white border-red-600" : "border-gray-200 text-gray-600"}`}
                data-testid="filter-nonveg"
              >
                Non-Veg
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="search"
              placeholder="Search dishes..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              onChange={e => setSearch(e.target.value)}
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedCategory === null ? "bg-primary text-white shadow-sm" : "bg-gray-100 text-gray-600"}`}
            data-testid="cat-all"
          >
            All
          </button>
          {catsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full flex-shrink-0" />
            ))
          ) : (
            categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedCategory === cat.id ? "bg-primary text-white shadow-sm" : "bg-gray-100 text-gray-600"}`}
                data-testid={`cat-${cat.id}`}
              >
                {cat.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-xl mx-auto px-4 py-4 pb-28">
        {itemsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : menuItems.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="text-5xl mb-4 text-gray-200">✦</div>
            <h3 className="font-semibold text-gray-600 mb-1">Nothing found</h3>
            <p className="text-sm text-gray-400">Try a different search or category</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map((item, i) => (
              <FoodCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Sticky Cart Button */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 max-w-xl mx-auto z-50"
          >
            <button
              onClick={() => setLocation("/cart")}
              className="w-full bg-primary text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-xl hover:bg-primary/90 transition-colors active:scale-[0.98]"
              data-testid="cart-button"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl w-8 h-8 flex items-center justify-center">
                  <ShoppingCart size={16} />
                </div>
                <div className="text-left">
                  <p className="text-xs opacity-80">{count} item{count !== 1 ? "s" : ""}</p>
                  <p className="font-bold text-sm">View Cart</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold">₹{total.toFixed(0)}</span>
                <ChevronRight size={16} />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
