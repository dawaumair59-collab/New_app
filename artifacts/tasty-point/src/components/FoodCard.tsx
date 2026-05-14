import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { VegBadge } from "./VegBadge";
import { SpiceBadge } from "./SpiceBadge";
import { useCart } from "@/lib/cart-store";
import type { MenuItem } from "@workspace/api-client-react";

interface FoodCardProps {
  item: MenuItem;
  index?: number;
  onClick?: () => void;
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
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow duration-200 active:scale-[0.98]"
      onClick={onClick}
      data-testid={`food-card-${item.id}`}
    >
      <div className="relative">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-44 object-cover"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
            <span className="text-4xl text-red-200">✦</span>
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-2xl">
            <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">Unavailable</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start gap-2 mb-1">
          <VegBadge isVeg={item.isVeg} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.name}</h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-2 ml-6">
          <SpiceBadge level={item.spiceLevel} />
          {item.preparationTime && (
            <span className="text-[10px] text-gray-400">{item.preparationTime} min</span>
          )}
        </div>

        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 ml-6">{item.description}</p>
        )}

        <div className="flex items-center justify-between ml-6">
          <span className="font-bold text-gray-900">₹{item.price}</span>
          {item.isAvailable && (
            qty === 0 ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleAdd}
                className="flex items-center gap-1 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm hover:bg-primary/90 transition-colors"
                data-testid={`add-btn-${item.id}`}
              >
                <Plus size={12} /> Add
              </motion.button>
            ) : (
              <div className="flex items-center gap-2 bg-primary rounded-full px-2 py-1">
                <button onClick={handleMinus} className="text-white hover:text-white/80" data-testid={`minus-btn-${item.id}`}>
                  <Minus size={12} />
                </button>
                <span className="text-white font-bold text-xs w-4 text-center">{qty}</span>
                <button onClick={handlePlus} className="text-white hover:text-white/80" data-testid={`plus-btn-${item.id}`}>
                  <Plus size={12} />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
