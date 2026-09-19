import { cn } from "cn";
import type { ComponentProps, CSSProperties } from "react";

export function Container(props: ComponentProps<"div">) {
  return (
    <div
      id="nd-docs-layout"
      {...props}
      style={
        {
          gridTemplate: `"header header header header header"
"sidebar sidebar toc-popover toc toc"
"sidebar sidebar main toc toc" 1fr / minmax(min-content, 1fr) var(--fd-sidebar-width) minmax(0, calc(var(--fd-layout-width,97rem) - var(--fd-sidebar-width) - var(--fd-toc-width))) var(--fd-toc-width) minmax(min-content, 1fr)`,
          "--fd-docs-row-1": "var(--fd-banner-height, 0px)",
          "--fd-docs-row-2": "calc(var(--fd-docs-row-1) + var(--fd-header-height))",
          "--fd-docs-row-3": "calc(var(--fd-docs-row-2) + var(--fd-toc-popover-height))",
          ...props.style,
        } as CSSProperties
      }
      className={cn(
        "grid overflow-x-clip min-h-(--fd-docs-height) [--fd-docs-height:100dvh] [--fd-header-height:0px] [--fd-toc-popover-height:0px] [--fd-sidebar-width:0px] [--fd-toc-width:0px] xl:[--fd-toc-width:268px]",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
