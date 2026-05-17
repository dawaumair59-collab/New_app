import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { QrCode, LayoutDashboard, ChevronRight, Star, Clock, Leaf } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  } as any;
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  } as any;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Rich gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7f1d1d] via-[#991b1b] to-[#1a0507]" />

      {/* Decorative circles */}
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-white/5" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute top-1/3 -right-20 w-48 h-48 rounded-full bg-red-400/10" />

      {/* Floating food emojis */}
      <motion.span
        animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-16 right-12 text-5xl opacity-20 select-none"
      >🍛</motion.span>
      <motion.span
        animate={{ y: [0, 10, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-32 right-8 text-4xl opacity-15 select-none"
      >🍜</motion.span>
      <motion.span
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        className="absolute top-1/2 left-6 text-3xl opacity-15 select-none"
      >🌮</motion.span>
      <motion.span
        animate={{ y: [0, 8, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-24 left-10 text-3xl opacity-10 select-none"
      >🍕</motion.span>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-10">
            <motion.div
              whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.4 } }}
              className="w-24 h-24 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-5 border border-white/20 shadow-2xl"
            >
              <span className="text-5xl select-none">🍽️</span>
            </motion.div>

            <h1 className="font-serif text-5xl font-bold text-white text-center leading-none mb-2">
              Tasty Point
            </h1>
            <p className="text-white/60 text-sm text-center font-medium tracking-wide">
              Smart QR Restaurant Ordering
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 mb-8">
            {[
              { icon: Star, label: "4.8 Stars", color: "text-yellow-400" },
              { icon: Clock, label: "Fast Orders", color: "text-blue-300" },
              { icon: Leaf, label: "Fresh Daily", color: "text-green-400" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 border border-white/15">
                <Icon size={12} className={color} />
                <span className="text-white/80 text-[11px] font-semibold">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* Action buttons */}
          <motion.div variants={itemVariants} className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation("/menu")}
              className="w-full flex items-center justify-between bg-white text-gray-900 px-6 py-4 rounded-2xl font-bold shadow-2xl hover:shadow-xl transition-all"
              data-testid="customer-menu-btn"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/40">
                  <QrCode size={19} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900 text-sm">Customer Menu</p>
                  <p className="text-xs text-gray-400 font-medium">Browse & order dishes</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation("/admin")}
              className="w-full flex items-center justify-between glass border border-white/25 text-white px-6 py-4 rounded-2xl font-bold hover:bg-white/15 transition-all"
              data-testid="admin-panel-btn"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20">
                  <LayoutDashboard size={19} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white text-sm">Admin Panel</p>
                  <p className="text-xs text-white/50 font-medium">Manage your restaurant</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-white/40" />
            </motion.button>
          </motion.div>

          {/* Footer hint */}
          <motion.p
            variants={itemVariants}
            className="text-white/30 text-xs text-center mt-8 font-medium"
          >
            Scan a table QR code to start ordering
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom wave cutoff */}
      <div className="relative z-10 h-8 bg-gray-50 rounded-t-[28px] -mt-4" />
    </div>
  );
}
