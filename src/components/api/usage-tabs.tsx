import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fumadocs/api-docs/components/select";
import { useComponents } from "fumadocs-openapi";
import { useCodeUsage, useOperation } from "fumadocs-openapi/operation";
import { useMemo } from "react";
import { CopyButton } from "@/components/api/copy-button";
import { useSharedSelection } from "@/components/api/use-shared-selection";
import { cn } from "@/lib/cn";

const GROUP_ID = "fumadocs_openapi_requests";

export const UsageTabs = () => {
  const { title, codeUsages } = useOperation();
  const { CodeBlock } = useComponents();
  const items = useMemo(() => Array.from(codeUsages.map().entries()), [codeUsages]);
  const [activeId, setActiveId] = useSharedSelection(GROUP_ID);
  const [id, generator] = items.find(([value]) => value === activeId) ?? items[0] ?? [];
  const code = useCodeUsage(id);
  if (!generator) return null;

  return (
    <div className="not-prose overflow-hidden rounded-xl border bg-fd-card">
      <div className="flex flex-row items-center gap-2 border-b p-1.5 ps-3">
        <p className="min-w-0 flex-1 text-xs font-medium whitespace-nowrap">{title}</p>
        <div className="flex flex-row items-center gap-3">
          <Select value={id}>
            <SelectTrigger className="bg-fd-background px-2 py-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map(([value, item]) => (
                <SelectItem
                  key={value}
                  value={value}
                  onClick={() => setActiveId(value)}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs",
                    value === id
                      ? "bg-fd-secondary text-fd-secondary-foreground"
                      : "text-fd-muted-foreground hover:text-fd-foreground",
                  )}
                >
                  {item.label ?? item.lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {code && <CopyButton code={code} />}
        </div>
      </div>
      {code && <CodeBlock lang={generator.lang} code={code} />}
    </div>
  );
};
