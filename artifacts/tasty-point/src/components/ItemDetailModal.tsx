import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingCart, Play, Pause, ChefHat } from "lucide-react";
import { VegBadge } from "./VegBadge";
import { SpiceBadge } from "./SpiceBadge";
import { useCart } from "@/lib/cart-store";
import type { MenuItem } from "@workspace/api-client-react";

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        onCanPlay={() => setLoaded(true)}
        onEnded={() => setPlaying(false)}
        playsInline
        preload="metadata"
      />
      <button
        onClick={toggle}
        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
      >
        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          {playing ? <Pause size={22} className="text-gray-800" /> : <Play size={22} className="text-gray-800 translate-x-0.5" />}
        </div>
      </button>
    </div>
  );
}

function FoodImage({ src, name }: { src: string | null | undefined; name: string }) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={name}
        className="w-full h-64 object-cover"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div className="w-full h-64 bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 flex flex-col items-center justify-center gap-3">
      <div className="w-20 h-20 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm">
        <ChefHat size={36} className="text-red-300" />
      </div>
      <p className="text-sm text-red-300 font-medium">{name}</p>
    </div>
  );
}

export function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const { items, addItem, updateQuantity } = useCart();

  if (!item) return null;

  const cartItem = items.find(i => i.menuItemId === item.id);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
    });
  };

  const tags = item.tags ? item.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
        data-testid="item-modal-backdrop"
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}
          data-testid="item-modal"
        >
          {/* Image / Video */}
          <div className="relative flex-shrink-0">
            {item.videoUrl ? (
              <div className="p-3 bg-gray-950">
                <VideoPlayer src={item.videoUrl} />
              </div>
            ) : (
              <FoodImage src={item.imageUrl} name={item.name} />
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
              data-testid="modal-close"
            >
              <X size={16} />
            </button>

            {/* Availability overlay */}
            {!item.isAvailable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold text-base bg-black/70 px-4 py-2 rounded-full">
                  Currently Unavailable
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-5 py-4">
            {/* Name & badge row */}
            <div className="flex items-start gap-2 mb-2">
              <VegBadge isVeg={item.isVeg} size="md" />
              <h2 className="font-serif text-xl font-bold text-gray-900 leading-tight flex-1">{item.name}</h2>
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 mb-3 ml-7">
              <SpiceBadge level={item.spiceLevel} />
              {item.preparationTime && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {item.preparationTime} min
                </span>
              )}
              {tags.map(tag => (
                <span key={tag} className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                  {tag}
                </span>
              ))}
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{item.description}</p>
            )}

            {/* Video if image was shown above */}
            {item.videoUrl && !item.imageUrl && null}
            {item.videoUrl && item.imageUrl && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Watch</p>
                <VideoPlayer src={item.videoUrl} />
              </div>
            )}
          </div>

          {/* Footer: price + add to cart */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400">Price</p>
              <p className="text-2xl font-bold text-gray-900">₹{item.price}</p>
            </div>

            {item.isAvailable && (
              qty === 0 ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAdd}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-md hover:bg-primary/90 transition-colors"
                  data-testid="modal-add-btn"
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </motion.button>
              ) : (
                <div className="flex items-center gap-0">
                  <button
                    onClick={() => updateQuantity(item.id, qty - 1)}
                    className="w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
                    data-testid="modal-minus-btn"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-bold text-lg text-gray-900">{qty}</span>
                  <button
                    onClick={() => updateQuantity(item.id, qty + 1)}
                    className="w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center transition-colors"
                    data-testid="modal-plus-btn"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )
            )}
            {!item.isAvailable && (
              <span className="text-sm text-gray-400 font-medium">Unavailable</span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
