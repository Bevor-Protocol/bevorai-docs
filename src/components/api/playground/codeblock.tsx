"use client";
import { useRenderContext } from "fumadocs-openapi/ui";
import {
  DynamicCodeBlock,
  type DynamicCodeblockProps,
} from "fumadocs-ui/components/dynamic-codeblock.core";

export function ClientCodeBlock(props: Omit<DynamicCodeblockProps, "highlighter" | "options">) {
  const {
    shiki,
    shikiOptions,
    renderCodeBlock,
    components: { CodeBlock: Comp } = {},
  } = useRenderContext();
  if (renderCodeBlock) return renderCodeBlock(props);
  if (Comp) return <Comp {...props} />;

  return (
    <DynamicCodeBlock highlighter={() => shiki.getOrInit()} options={shikiOptions} {...props} />
  );
}
