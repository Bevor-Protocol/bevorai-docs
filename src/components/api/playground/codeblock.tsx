import { useShikiDynamic } from "fumadocs-core/highlight/shiki/react";
import { type CodeBlockProps, useRenderContext } from "fumadocs-openapi";
import { CopyButton } from "@/components/api/copy-button";
import { cn } from "@/lib/cn";

export function ClientCodeBlock({ lang, code, codeblock }: CodeBlockProps) {
  const { shiki, shikiOptions } = useRenderContext();
  const rendered = useShikiDynamic(
    () => shiki.getOrInit(),
    code,
    {
      ...shikiOptions,
      lang,
      defaultValue: (
        <pre className="fd-codeblock">
          <code>{code}</code>
        </pre>
      ),
    },
    [code, lang],
  );

  return (
    <figure className={cn("group relative my-0 bg-fd-card text-sm", codeblock?.className)}>
      <CopyButton
        code={code}
        className="absolute inset-e-2 top-2 z-10 bg-fd-card opacity-0 transition-opacity group-hover:opacity-100"
      />
      {rendered}
    </figure>
  );
}
