const PALETTE = ["#25A6EE", "#A361CF", "#13C8A5", "#CB41A2", "#F59D02", "#4883CF", "#46AF6A"];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  }[size];

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${sizeClasses}`}
      style={{ backgroundColor: colorForName(name) }}
    >
      {initials(name)}
    </span>
  );
}
