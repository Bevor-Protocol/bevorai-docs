"use client";

import { useTranslations } from "@fuma-translate/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fumadocs/api-docs/components/select";
import type { RenderContext } from "fumadocs-openapi";
import type { CreateOpenAPIPageOptions } from "fumadocs-openapi/ui";
import type { CodeBlockProps } from "fumadocs-ui/components/codeblock";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/api/copy-button";
import { ClientCodeBlock } from "@/components/api/playground/codeblock";
import { useSharedSelection } from "@/components/api/use-shared-selection";
import { cn } from "@/lib/cn";

const GROUP_ID = "fumadocs_openapi_responses";

const CODE_BLOCK_PROPS = {
  allowCopy: false,
  className: "my-0 rounded-none border-0 bg-transparent shadow-none",
} satisfies CodeBlockProps;

type RenderResponseTabs = NonNullable<
  NonNullable<CreateOpenAPIPageOptions["content"]>["renderResponseTabs"]
>;
export type ResponseTabsRenderOptions = Parameters<RenderResponseTabs>[0];

const statusColor = (code: string) => {
  const status = Number.parseInt(code, 10);

  if (Number.isNaN(status)) return "bg-fd-muted-foreground";
  if (status < 300) return "bg-green-500";
  if (status < 400) return "bg-yellow-500";
  return "bg-red-500";
};

const langOf = (mediaType: string | null) => {
  if (!mediaType) return "json";
  if (mediaType.includes("json")) return "json";
  if (mediaType.includes("xml")) return "xml";
  if (mediaType.includes("html")) return "html";
  return "text";
};

const Markdown = ({ md, ctx }: { md: string; ctx: RenderContext }) => {
  const rendered = useMemo(() => ctx._default_processMarkdown(md), [ctx, md]);

  if (ctx.renderMarkdown) return ctx.renderMarkdown(md);
  if (ctx.components?.Markdown) return <ctx.components.Markdown md={md} />;
  return rendered;
};

export const ResponseTabs = ({
  options,
  ctx,
}: {
  options: ResponseTabsRenderOptions;
  ctx: RenderContext;
}) => {
  const t = useTranslations({ note: "operation page" });
  const [activeCode, setActiveCode] = useSharedSelection(GROUP_ID);
  const [exampleIndex, setExampleIndex] = useState(0);

  const { tabs } = options;
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
            <span className={cn("size-1.5 rounded-full", statusColor(item.code))} />
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
                  // biome-ignore lint/suspicious/noArrayIndexKey: examples have no stable id
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
          <Markdown md={example.description} ctx={ctx} />
        </div>
      )}
      {code ? (
        <ClientCodeBlock
          lang={langOf(tab.mediaType)}
          code={code}
          codeblock={CODE_BLOCK_PROPS}
        />
      ) : (
        <p className="px-3 py-2.5 text-xs text-fd-muted-foreground">{t("Empty")}</p>
      )}
    </div>
  );
};
