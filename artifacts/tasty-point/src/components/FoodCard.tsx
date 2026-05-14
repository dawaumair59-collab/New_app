import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ChefHat, PlayCircle, Clock } from "lucide-react";
import { VegBadge } from "./VegBadge";
import { SpiceBadge } from "./SpiceBadge";
import { useCart } from "@/lib/cart-store";
import type { MenuItem } from "@workspace/api-client-react";

interface FoodCardProps {
  item: MenuItem;
  index?: number;
  onClick?: () => void;
}

const FALLBACK_GRADIENTS = [
  { bg: "from-red-100 to-rose-200", icon: "text-red-300" },
  { bg: "from-orange-100 to-amber-200", icon: "text-orange-300" },
  { bg: "from-yellow-100 to-orange-200", icon: "text-yellow-400" },
  { bg: "from-emerald-100 to-green-200", icon: "text-emerald-300" },
  { bg: "from-sky-100 to-blue-200", icon: "text-sky-300" },
  { bg: "from-violet-100 to-purple-200", icon: "text-violet-300" },
  { bg: "from-pink-100 to-rose-200", icon: "text-pink-300" },
];

function CardImage({ src, name }: { src: string | null | undefined; name: string }) {
  const [errored, setErrored] = useState(false);

  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const fallback = FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length];

  if (src && !errored) {
    return (
      <>
        <img
          src={src}
          alt={name}
          className="w-full h-48 object-cover"
          onError={() => setErrored(true)}
          loading="lazy"
        />
        {/* Gradient overlay on bottom of real image */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      </>
    );
  }

  return (
    <div className={`w-full h-48 bg-gradient-to-br ${fallback.bg} flex flex-col items-center justify-center gap-2`}>
      <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
        <ChefHat size={26} className={fallback.icon} />
      </div>
      <span className="text-[10px] text-gray-500/80 font-medium px-3 text-center leading-snug max-w-[90%] line-clamp-2">
        {name}
      </span>
    </div>
  );
}

export function FoodCard({ item, index = 0, onClick }: FoodCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find(i => i.menuItemId === item.id);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
    });
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(item.id, qty - 1);
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(item.id, qty + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.5), ease: "easeOut" }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-3xl overflow-hidden cursor-pointer"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)" }}
      onClick={onClick}
      data-testid={`food-card-${item.id}`}
    >
      {/* Image area */}
      <div className="relative overflow-hidden">
        <CardImage src={item.imageUrl} name={item.name} />

        {/* Video badge */}
        {item.videoUrl && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/55 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-full">
            <PlayCircle size={10} className="fill-white/80" />
            VIDEO
          </div>
        )}

        {/* Unavailable overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-white font-semibold text-xs bg-black/70 px-3 py-1 rounded-full tracking-wide">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 pt-2.5">
        {/* Name row */}
        <div className="flex items-start gap-1.5 mb-1">
          <VegBadge isVeg={item.isVeg} />
          <h3 className="font-bold text-gray-900 text-[13px] leading-snug line-clamp-2 flex-1">
            {item.name}
          </h3>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 mb-1.5 ml-[22px] flex-wrap">
          <SpiceBadge level={item.spiceLevel} />
          {item.preparationTime && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-medium">
              <Clock size={9} />
              {item.preparationTime}m
            </span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-[11px] text-gray-400 line-clamp-2 mb-2 ml-[22px] leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Price + Add */}
        <div className="flex items-center justify-between ml-[22px] mt-1">
          <div>
            <span className="font-extrabold text-gray-900 text-sm tracking-tight">
              ₹{item.price}
            </span>
          </div>

          {item.isAvailable && (
            qty === 0 ? (
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleAdd}
                className="flex items-center gap-1 bg-primary text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-md shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-colors"
                data-testid={`add-btn-${item.id}`}
              >
                <Plus size={11} strokeWidth={3} />
                Add
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 bg-primary rounded-full px-1.5 py-1 shadow-md shadow-primary/30"
              >
                <button
                  onClick={handleMinus}
                  className="text-white w-5 h-5 flex items-center justify-center"
                  data-testid={`minus-btn-${item.id}`}
                >
                  <Minus size={11} strokeWidth={3} />
                </button>
                <motion.span
                  key={qty}
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.18 }}
                  className="text-white font-bold text-xs w-5 text-center"
                >
                  {qty}
                </motion.span>
                <button
                  onClick={handlePlus}
                  className="text-white w-5 h-5 flex items-center justify-center"
                  data-testid={`plus-btn-${item.id}`}
                >
                  <Plus size={11} strokeWidth={3} />
                </button>
              </motion.div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
