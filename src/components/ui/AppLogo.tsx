import clsx from "clsx";
import { Zap } from "lucide-react";

const SIZES = {
  sm: { box: "h-8 w-8 rounded-lg", icon: 16 },
  md: { box: "h-14 w-14 rounded-2xl", icon: 28 },
} as const;

export default function AppLogo({ size = "md" }: { size?: keyof typeof SIZES }) {
  const { box, icon } = SIZES[size];
  return (
    <div
      className={clsx(
        "flex items-center justify-center bg-brand text-white shadow-soft",
        box
      )}
    >
      <Zap size={icon} strokeWidth={2.5} fill="currentColor" className="opacity-95" />
    </div>
  );
}
