import Chip from "@/components/ui/Chip";
import type { ContentScope } from "@/types";

export default function QuestionScopeChip({ scope }: { scope: ContentScope }) {
  return (
    <Chip
      variant={scope === "group" ? "brand" : "muted"}
      className="!px-1.5 !py-0 !text-[10px] !font-semibold uppercase"
    >
      {scope === "group" ? "Group" : "Personal"}
    </Chip>
  );
}
