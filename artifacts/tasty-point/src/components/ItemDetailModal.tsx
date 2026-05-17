import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Minus, ShoppingCart, Play, Pause,
  ChefHat, Clock, Share2, AlertTriangle, Flame, CheckCircle2
} from "lucide-react";
import { VegBadge } from "./VegBadge";
import { SpiceBadge } from "./SpiceBadge";
import { useCart } from "@/lib/cart-store";
import type { MenuItem } from "@workspace/api-client-react";

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
  allItems?: MenuItem[];
}

function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };
  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <video ref={videoRef} src={src} className="w-full h-full object-cover" onCanPlay={() => setLoaded(true)} onEnded={() => setPlaying(false)} playsInline preload="metadata" />
      <button onClick={toggle} className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          {playing ? <Pause size={22} className="text-gray-800" /> : <Play size={22} className="text-gray-800 translate-x-0.5" />}
        </div>
      </button>
    </div>
  );
}

function NutritionBox({ label, value, unit = "" }: { label: string; value: string | number | null | undefined; unit?: string }) {
  if (!value) return null;
  return (
    <div className="flex-1 bg-[#FFF8F0] rounded-2xl p-3 text-center border border-orange-100">
      <p className="text-lg font-extrabold text-gray-900">{value}{unit}</p>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function PairCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="flex-shrink-0 w-32 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      {item.imageUrl && !errored ? (
        <img src={item.imageUrl} alt={item.name} className="w-full h-20 object-cover" onError={() => setErrored(true)} />
      ) : (
        <div className="w-full h-20 bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
          <ChefHat size={20} className="text-red-300" />
        </div>
      )}
      <div className="p-2">
        <p className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-bold text-[#C8202A]">₹{item.price}</span>
          <button
            onClick={onAdd}
            className="w-5 h-5 rounded-full bg-[#C8202A] text-white flex items-center justify-center"
          >
            <Plus size={10} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ItemDetailModal({ item, onClose, allItems = [] }: ItemDetailModalProps) {
  const { items, addItem, updateQuantity } = useCart();
  const [added, setAdded] = useState(false);

  if (!item) return null;

  const cartItem = items.find(i => i.menuItemId === item.id);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    addItem({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl, isVeg: item.isVeg });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const tags = item.tags ? item.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
  const ingredientList = item.ingredients ? item.ingredients.split(",").map(s => s.trim()).filter(Boolean) : [];
  const allergens = item.allergenInfo ? item.allergenInfo.split(",").map(s => s.trim()).filter(Boolean) : [];
  const pairIds = item.pairWithIds ? item.pairWithIds.split(",").map(Number).filter(Boolean) : [];
  const pairedItems = allItems.filter(m => pairIds.includes(m.id) && m.isAvailable && m.id !== item.id);
  const savings = item.originalPrice ? item.originalPrice - item.price : 0;

  const handleShare = () => {
    if ('share' in navigator) {
      (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
        title: item.name,
        text: `Check out ${item.name} for ₹${item.price}!`,
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
        onClick={onClose}
        data-testid="item-modal-backdrop"
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="w-full sm:max-w-md max-h-[95vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
          style={{ background: "#FFF8F0" }}
          onClick={e => e.stopPropagation()}
          data-testid="item-modal"
        >
          {/* ── HERO IMAGE ── */}
          <div className="relative flex-shrink-0 h-56 sm:h-64 bg-gray-900 overflow-hidden">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center">
                <ChefHat size={56} className="text-white/30" />
              </div>
            )}
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Top controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <button onClick={onClose} className="w-9 h-9 glass rounded-full flex items-center justify-center border border-white/20 shadow-sm" data-testid="modal-close">
                <X size={16} className="text-white" />
              </button>
              {'share' in navigator && (
                <button onClick={handleShare} className="w-9 h-9 glass rounded-full flex items-center justify-center border border-white/20 shadow-sm">
                  <Share2 size={15} className="text-white" />
                </button>
              )}
            </div>

            {/* Bestseller badge */}
            {item.isBestseller && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "#E8A020", color: "#fff" }}>
                  <Flame size={12} />
                  Most Ordered
                </div>
              </div>
            )}

            {/* Unavailable overlay */}
            {!item.isAvailable && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-sm bg-black/70 px-4 py-2 rounded-full">Currently Unavailable</span>
              </div>
            )}
          </div>

          {/* ── SCROLLABLE CONTENT ── */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="px-5 py-4 space-y-5">

              {/* ── TITLE SECTION ── */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <VegBadge isVeg={item.isVeg} size="md" />
                  <h2 className="font-serif text-2xl font-bold text-gray-900 leading-tight flex-1">{item.name}</h2>
                </div>

                <div className="flex items-center gap-3 flex-wrap mt-2 ml-7">
                  <SpiceBadge level={item.spiceLevel} />
                  {item.preparationTime && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                      <Clock size={12} /> {item.preparationTime} min
                    </span>
                  )}
                  {tags.map(tag => (
                    <span key={tag} className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{tag}</span>
                  ))}
                  <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">Tasty Point</span>
                </div>
              </div>

              {/* ── DESCRIPTION ── */}
              {item.description && (
                <div>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{item.description}</p>
                </div>
              )}

              {/* ── INGREDIENTS ── */}
              {ingredientList.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ingredients</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ingredientList.map((ing, i) => (
                      <span key={i} className="text-xs bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full font-medium shadow-sm">{ing}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── NUTRITION ── */}
              {(item.calories || item.protein || item.carbs || item.fat) && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nutrition</p>
                  <div className="flex gap-2">
                    <NutritionBox label="Calories" value={item.calories} unit=" kcal" />
                    <NutritionBox label="Protein" value={item.protein} />
                    <NutritionBox label="Carbs" value={item.carbs} />
                    <NutritionBox label="Fat" value={item.fat} />
                  </div>
                </div>
              )}

              {/* ── ALLERGEN ── */}
              {allergens.length > 0 && (
                <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
                  <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700 font-medium">
                    <span className="font-bold">Allergens:</span> {allergens.join(", ")}
                  </p>
                </div>
              )}

              {/* ── VIDEO ── */}
              {item.videoUrl && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Watch</p>
                  <VideoPlayer src={item.videoUrl} />
                </div>
              )}

              {/* ── PAIR IT WITH ── */}
              {pairedItems.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pair It With</p>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                    {pairedItems.map(paired => (
                      <PairCard
                        key={paired.id}
                        item={paired}
                        onAdd={() => addItem({ menuItemId: paired.id, name: paired.name, price: paired.price, imageUrl: paired.imageUrl, isVeg: paired.isVeg })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom spacing for fixed bar */}
              <div className="h-4" />
            </div>
          </div>

          {/* ── FIXED BOTTOM BAR ── */}
          <div className="flex-shrink-0 px-5 py-4 bg-white border-t border-gray-100" style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between gap-4">
              {/* Price block */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-gray-900">₹{item.price}</span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-sm text-gray-400 line-through">₹{item.originalPrice}</span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-xs font-bold text-green-600">You save ₹{savings.toFixed(0)}!</p>
                )}
              </div>

              {/* Add to cart / quantity */}
              {item.isAvailable && (
                qty === 0 ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAdd}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all ${
                      added
                        ? "bg-green-500 text-white"
                        : "text-white"
                    }`}
                    style={added ? {} : { background: "#C8202A", boxShadow: "0 4px 16px rgba(200,32,42,0.35)" }}
                    data-testid="modal-add-btn"
                  >
                    {added ? <CheckCircle2 size={16} /> : <ShoppingCart size={16} />}
                    {added ? "Added!" : "Add to Cart"}
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-1 rounded-2xl border-2 border-[#C8202A] overflow-hidden">
                    <button onClick={() => updateQuantity(item.id, qty - 1)} className="w-10 h-10 flex items-center justify-center text-[#C8202A] hover:bg-red-50 transition-colors" data-testid="modal-minus-btn">
                      <Minus size={16} />
                    </button>
                    <motion.span key={qty} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="w-8 text-center font-extrabold text-gray-900 text-lg">
                      {qty}
                    </motion.span>
                    <button onClick={() => { updateQuantity(item.id, qty + 1); }} className="w-10 h-10 flex items-center justify-center text-[#C8202A] hover:bg-red-50 transition-colors" data-testid="modal-plus-btn">
                      <Plus size={16} />
                    </button>
                  </div>
                )
              )}
              {!item.isAvailable && (
                <span className="text-sm text-gray-400 font-medium">Unavailable</span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
