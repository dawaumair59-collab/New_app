interface SpiceBadgeProps {
  level: string | null | undefined;
}

const config: Record<string, { label: string; color: string }> = {
  mild: { label: "Mild", color: "bg-amber-100 text-amber-700" },
  medium: { label: "Medium", color: "bg-orange-100 text-orange-700" },
  spicy: { label: "Spicy", color: "bg-red-100 text-red-700" },
};

export function SpiceBadge({ level }: SpiceBadgeProps) {
  if (!level || !config[level]) return null;
  const { label, color } = config[level];
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}
