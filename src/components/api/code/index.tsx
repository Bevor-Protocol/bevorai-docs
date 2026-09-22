import { defaultShikiFactory } from "fumadocs-core/highlight/shiki/full";
import { useShikiDynamic } from "fumadocs-core/highlight/shiki/react";
import { cn } from "@/lib/cn";
import { CopyButton } from "../copy-button";

export const ClientCodeBlock: React.FC<{
  lang: string;
  code: string;
  showCopy?: boolean;
  className?: string;
}> = ({ lang, code, showCopy = false, className }) => {
  const rendered = useShikiDynamic(
    () => defaultShikiFactory.getOrInit(),
    code,
    {
      ...{
        themes: {
          light: "light-plus",
          dark: "dark-plus",
        },
        defaultColor: false,
      },
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
    <figure className={cn("group relative my-0 bg-fd-code-background text-sm", className)}>
      {showCopy && (
        <CopyButton
          code={code}
          className="absolute inset-e-2 top-2 z-10 bg-fd-card opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}
      {rendered}
    </figure>
  );
};
