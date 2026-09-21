import { useTranslations } from "@fuma-translate/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fumadocs/api-docs/components/select";
import { useComponents } from "fumadocs-openapi";
import type { ResponseTab } from "fumadocs-openapi/operation";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/api/copy-button";
import { useSharedSelection } from "@/components/api/use-shared-selection";
import { cn } from "@/lib/cn";

const GROUP_ID = "fumadocs_openapi_responses";

const langOf = (mediaType: string | null) => {
  if (!mediaType) return "json";
  if (mediaType.includes("json")) return "json";
  if (mediaType.includes("xml")) return "xml";
  if (mediaType.includes("html")) return "html";
  return "text";
};

export const ResponseTabs = ({ tabs }: { tabs: ResponseTab[] }) => {
  const t = useTranslations({ note: "operation page" });
  const { CodeBlock, Markdown } = useComponents();
  const [activeCode, setActiveCode] = useSharedSelection(GROUP_ID);
  const [exampleIndex, setExampleIndex] = useState(0);

  const tab = tabs.find((item) => item.code === activeCode) ?? tabs[0];
  const examples = tab?.examples ?? [];
  const index = Math.max(Math.min(exampleIndex, examples.length - 1), 0);
  const example = examples[index];

  const code = useMemo(
    () => (example ? JSON.stringify(example.sample, null, 2) : undefined),
    [example],
  );

  if (!tab) return null;

  return (
    <div className="not-prose mt-2 overflow-hidden rounded-xl border bg-fd-card">
      <div className="flex flex-row items-center gap-1 border-b p-1.5">
        {tabs.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setActiveCode(item.code)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs transition-colors",
              item.code === tab.code
                ? "bg-fd-secondary text-fd-secondary-foreground"
                : "text-fd-muted-foreground hover:text-fd-accent-foreground",
            )}
          >
            {item.code}
          </button>
        ))}
        <div className="ms-auto flex flex-row items-center gap-1">
          {examples.length > 1 && (
            <Select
              items={examples.map((item, i) => ({ value: i.toString(), label: item.label }))}
              value={index.toString()}
              onValueChange={(value) => value !== null && setExampleIndex(Number(value))}
            >
              <SelectTrigger className="w-auto gap-1.5 border-none bg-transparent py-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {examples.map((item, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {code && <CopyButton code={code} />}
        </div>
      </div>
      {example?.description && (
        <div className="border-b px-3 py-2 text-sm">
          <Markdown md={example.description} />
        </div>
      )}
      {code ? (
        <CodeBlock
          lang={langOf(tab.mediaType)}
          code={code}
          codeblock={{
            className: "max-h-200 overflow-scroll scrollbar-none",
          }}
        />
      ) : (
        <p className="px-3 py-2.5 text-xs text-fd-muted-foreground">{t("Empty")}</p>
      )}
    </div>
  );
};
