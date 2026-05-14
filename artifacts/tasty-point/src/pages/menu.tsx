import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Search, ShoppingCart, ChevronRight, Flame, Leaf, Sparkles, Star } from "lucide-react";
import { useListMenuItems, useListCategories } from "@workspace/api-client-react";
import type { MenuItem } from "@workspace/api-client-react";
import { FoodCard } from "@/components/FoodCard";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { useCart, loadTableId, saveTableId } from "@/lib/cart-store";
import { Skeleton } from "@/components/ui/skeleton";

function MenuHero({ tableId }: { tableId: number | null }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#7f1d1d] via-[#991b1b] to-[#3b0a0a] px-5 pt-10 pb-8">
      {/* Decorative circles */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute top-6 right-6 w-24 h-24 rounded-full bg-red-400/10" />

      {/* Floating food emojis */}
      <motion.span
        animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-8 right-10 text-3xl opacity-30 select-none"
      >🍛</motion.span>
      <motion.span
        animate={{ y: [0, 6, 0], rotate: [0, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-10 right-20 text-2xl opacity-20 select-none"
      >🍜</motion.span>
      <motion.span
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-12 left-4 text-2xl opacity-20 select-none"
      >🌮</motion.span>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        {/* Table badge */}
        {tableId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 glass rounded-full px-3 py-1 mb-4 border border-white/20"
          >
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/90 text-xs font-semibold tracking-wide">Table {tableId}</span>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="font-serif text-4xl font-bold text-white leading-tight mb-1"
        >
          Tasty Point
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white/60 text-sm font-medium tracking-wide mb-5"
        >
          Exquisite flavors, crafted with love
        </motion.p>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-4"
        >
          <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 border border-white/15">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white text-xs font-semibold">4.8 Rating</span>
          </div>
          <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 border border-white/15">
            <Flame size={11} className="text-orange-400" />
            <span className="text-white text-xs font-semibold">Fresh Daily</span>
          </div>
          <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 border border-white/15">
            <Leaf size={11} className="text-green-400" />
            <span className="text-white text-xs font-semibold">Veg &amp; NonVeg</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-5 bg-gray-50 rounded-t-[20px]" />
    </div>
  );
}

function CartBar({ count, total, onPress }: { count: number; total: number; onPress: () => void }) {
  const prevCount = useRef(count);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (count > prevCount.current) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 700);
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-2 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.08) 0%, transparent 100%)" }}
        >
          <motion.button
            animate={pulsing ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPress}
            className="pointer-events-auto w-full max-w-xl mx-auto block bg-gradient-to-r from-[#b91c1c] to-[#991b1b] text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-2xl"
            data-testid="cart-button"
            style={{ boxShadow: "0 8px 32px rgba(185,28,28,0.45), 0 2px 8px rgba(0,0,0,0.15)" }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-white/20 rounded-xl w-9 h-9 flex items-center justify-center">
                  <ShoppingCart size={17} />
                </div>
                <motion.div
                  key={count}
                  initial={{ scale: 1.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-primary rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ color: "hsl(0,72%,42%)" }}
                >
                  {count}
                </motion.div>
              </div>
              <div className="text-left">
                <p className="text-[11px] text-white/70 font-medium">{count} item{count !== 1 ? "s" : ""} in cart</p>
                <p className="font-bold text-sm leading-tight">View Cart</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-base">₹{total.toFixed(0)}</span>
              <ChevronRight size={18} className="opacity-80" />
            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const CATEGORY_EMOJIS: Record<string, string> = {
  starters: "🥗", appetizers: "🥗", "main course": "🍛", mains: "🍛",
  breads: "🫓", rice: "🍚", desserts: "🍮", sweets: "🍰",
  beverages: "🥤", drinks: "🥤", snacks: "🍟", biryani: "🍲",
  soups: "🍜", salads: "🥙", pizza: "🍕", burgers: "🍔",
  chinese: "🥢", south: "🍽️", north: "🫕", seafood: "🦐",
};

function getCategoryEmoji(name: string): string {
  const key = name.toLowerCase().trim();
  for (const [k, v] of Object.entries(CATEGORY_EMOJIS)) {
    if (key.includes(k)) return v;
  }
  return "🍽️";
}

export default function MenuPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [vegFilter, setVegFilter] = useState<boolean | null>(null);
  const [tableId, setTableId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const { total, count } = useCart();

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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <MenuHero tableId={tableId} />

      {/* Sticky Search + Filters */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 pt-3 pb-0">
          {/* Search + veg filters row */}
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              animate={{ flex: searchFocused ? 1 : 1 }}
              className="relative flex-1"
            >
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
                size={15}
                style={{ color: searchFocused ? "hsl(0,72%,42%)" : "#9ca3af" }}
              />
              <input
                type="search"
                placeholder="Search dishes, cuisines…"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none transition-all focus:ring-2 focus:ring-primary/25 focus:bg-white border border-transparent focus:border-primary/20"
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                data-testid="search-input"
              />
            </motion.div>

            {/* Veg/NonVeg toggle buttons */}
            <button
              onClick={() => setVegFilter(v => v === true ? null : true)}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-full border text-[11px] font-semibold transition-all flex-shrink-0 ${
                vegFilter === true
                  ? "bg-green-600 text-white border-green-600 shadow-sm"
                  : "border-gray-200 text-gray-500 bg-white"
              }`}
              data-testid="filter-veg"
            >
              <span className="w-2.5 h-2.5 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                <span className={`w-1 h-1 rounded-full ${vegFilter === true ? "bg-white" : "bg-green-600"}`} />
              </span>
              Veg
            </button>
            <button
              onClick={() => setVegFilter(v => v === false ? null : false)}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-full border text-[11px] font-semibold transition-all flex-shrink-0 ${
                vegFilter === false
                  ? "bg-red-600 text-white border-red-600 shadow-sm"
                  : "border-gray-200 text-gray-500 bg-white"
              }`}
              data-testid="filter-nonveg"
            >
              <span className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent flex-shrink-0"
                style={{ borderBottomColor: vegFilter === false ? "white" : "#dc2626" }} />
              Non-Veg
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedCategory === null
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            data-testid="cat-all"
          >
            <Sparkles size={11} />
            All
          </motion.button>

          {catsLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-24 rounded-full flex-shrink-0" />
              ))
            : categories.map(cat => (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  data-testid={`cat-${cat.id}`}
                >
                  <span>{getCategoryEmoji(cat.name)}</span>
                  {cat.name}
                </motion.button>
              ))
          }
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-xl mx-auto px-4 pt-4 pb-32">
        {/* Active filter tag */}
        <AnimatePresence>
          {vegFilter !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <button
                onClick={() => setVegFilter(null)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span>{vegFilter ? "🟢 Veg only" : "🔴 Non-Veg only"}</span>
                <span className="ml-1 text-gray-400">✕</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {itemsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
              >
                <Skeleton className="h-60 rounded-3xl" />
              </motion.div>
            ))}
          </div>
        ) : menuItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4 select-none">🍽️</div>
            <h3 className="font-serif text-xl font-bold text-gray-700 mb-2">Nothing found</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              Try a different search or category
            </p>
            {(search || selectedCategory !== null || vegFilter !== null) && (
              <button
                onClick={() => { setSearch(""); setSelectedCategory(null); setVegFilter(null); }}
                className="mt-4 text-primary text-sm font-semibold underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-400 font-medium mb-3"
            >
              {menuItems.length} {menuItems.length === 1 ? "dish" : "dishes"} available
            </motion.p>
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map((item, i) => (
                <FoodCard
                  key={item.id}
                  item={item}
                  index={i}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      {/* Premium Sticky Cart Bar */}
      <CartBar count={count} total={total} onPress={() => setLocation("/cart")} />
    </div>
  );
}
