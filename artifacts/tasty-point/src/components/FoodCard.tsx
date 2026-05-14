import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ChefHat } from "lucide-react";
import { VegBadge } from "./VegBadge";
import { SpiceBadge } from "./SpiceBadge";
import { useCart } from "@/lib/cart-store";
import type { MenuItem } from "@workspace/api-client-react";

interface FoodCardProps {
  item: MenuItem;
  index?: number;
  onClick?: () => void;
}

function CardImage({ src, name }: { src: string | null | undefined; name: string }) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={name}
        className="w-full h-44 object-cover"
        onError={() => setErrored(true)}
        loading="lazy"
      />
    );
  }

  // Gradient fallback based on name hash for variety
  const colors = [
    "from-red-50 to-rose-100",
    "from-orange-50 to-amber-100",
    "from-yellow-50 to-orange-100",
    "from-emerald-50 to-green-100",
    "from-sky-50 to-blue-100",
    "from-violet-50 to-purple-100",
    "from-pink-50 to-rose-100",
  ];
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const gradient = colors[hash % colors.length];

  return (
    <div className={`w-full h-44 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-1.5`}>
      <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center">
        <ChefHat size={22} className="text-gray-400" />
      </div>
      <span className="text-[10px] text-gray-400 font-medium px-2 text-center leading-tight">{name}</span>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.5) }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-[0.98] transition-shadow duration-200"
      onClick={onClick}
      data-testid={`food-card-${item.id}`}
    >
      {/* Image area */}
      <div className="relative overflow-hidden">
        <CardImage src={item.imageUrl} name={item.name} />
        {item.videoUrl && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full" /> VIDEO
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-xs bg-black/60 px-2.5 py-1 rounded-full">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start gap-1.5 mb-1">
          <VegBadge isVeg={item.isVeg} />
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">{item.name}</h3>
        </div>

        <div className="flex items-center gap-1.5 mb-1.5 ml-6">
          <SpiceBadge level={item.spiceLevel} />
          {item.preparationTime && (
            <span className="text-[10px] text-gray-400">{item.preparationTime}m</span>
          )}
        </div>

        {item.description && (
          <p className="text-[11px] text-gray-400 line-clamp-2 mb-2 ml-6 leading-relaxed">{item.description}</p>
        )}

        <div className="flex items-center justify-between ml-6 mt-1">
          <span className="font-bold text-gray-900 text-sm">₹{item.price}</span>
          {item.isAvailable && (
            qty === 0 ? (
              <motion.button
                whileTap={{ scale: 0.90 }}
                onClick={handleAdd}
                className="flex items-center gap-1 bg-primary text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-sm hover:bg-primary/90 transition-colors"
                data-testid={`add-btn-${item.id}`}
              >
                <Plus size={11} /> Add
              </motion.button>
            ) : (
              <div className="flex items-center gap-1.5 bg-primary rounded-full px-2 py-1">
                <button onClick={handleMinus} className="text-white" data-testid={`minus-btn-${item.id}`}>
                  <Minus size={11} />
                </button>
                <span className="text-white font-bold text-xs w-4 text-center">{qty}</span>
                <button onClick={handlePlus} className="text-white" data-testid={`plus-btn-${item.id}`}>
                  <Plus size={11} />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
