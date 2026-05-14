interface VegBadgeProps {
  isVeg: boolean;
  size?: "sm" | "md";
}

export function VegBadge({ isVeg, size = "sm" }: VegBadgeProps) {
  const s = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  if (isVeg) {
    return (
      <div className={`${s} border-2 border-green-600 flex items-center justify-center rounded-sm flex-shrink-0`}>
        <div className="w-2 h-2 rounded-full bg-green-600" />
      </div>
    );
  }
  return (
    <div className={`${s} border-2 border-red-600 flex items-center justify-center rounded-sm flex-shrink-0`}>
      <div
        className="w-0 h-0"
        style={{
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderBottom: "7px solid #dc2626",
        }}
      />
    </div>
  );
}
