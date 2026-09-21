
import type { ComponentProps } from "react";
import { cn } from "../../../../lib/cn";
import { useDocsPage } from "./..";

export function Container(props: ComponentProps<"article">) {
  const { full } = useDocsPage();

  return (
    <main
      className={cn("grid [grid-area:main] justify-items-start", full && "xl:col-end-[toc]")}
      data-layout-main=""
    >
      <article
        id="nd-page"
        data-layout-content=""
        data-full={full}
        {...props}
        className={cn(
          "flex flex-col min-w-0 w-full max-w-225 px-4 py-6 gap-4 md:px-6 md:pt-8 xl:px-8 xl:pt-14",
          full && "xl:max-w-none",
          props.className,
        )}
      >
        {props.children}
      </article>
    </main>
  );
}
