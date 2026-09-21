import { useTranslations } from "@fuma-translate/react";
import { Check, Clipboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCopyButton } from "@/hooks/use-copy-button";
import { cn } from "@/lib/cn";

export const CopyButton = ({ code, className }: { code: string; className?: string }) => {
  const t = useTranslations({ note: "code block" });
  const [checked, onClick] = useCopyButton(() => navigator.clipboard.writeText(code));

  return (
    <button
      type="button"
      data-checked={checked || undefined}
      aria-label={
        checked ? t("Copied Text", { note: "aria-label" }) : t("Copy Text", { note: "aria-label" })
      }
      onClick={onClick}
      className={cn(
        buttonVariants({ size: "icon-xs" }),
        "text-fd-muted-foreground hover:text-fd-accent-foreground data-checked:text-fd-accent-foreground",
        className,
      )}
    >
      {checked ? <Check /> : <Clipboard />}
    </button>
  );
};
