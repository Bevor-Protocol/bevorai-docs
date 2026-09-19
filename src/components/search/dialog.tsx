"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "fumadocs-core/framework";
import type { SortedResult } from "fumadocs-core/search";
import { useDocsSearch } from "fumadocs-core/search/client";
import { fetchClient } from "fumadocs-core/search/client/fetch";
import { ChevronRight, Hash, SearchIcon } from "lucide-react";
import { Fragment, type ReactNode, useEffect, useEffectEvent, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const INPUT_ATTR = "data-search-input";

/** The server highlights matches by wrapping them in `<mark>`; everything else is literal. */
const highlight = (content: string): ReactNode[] =>
  content.split(/<mark>(.*?)<\/mark>/gs).map((part, index) =>
    index % 2 === 0 ? (
      part
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: split output is positional
      <mark key={index} className="bg-transparent text-fd-primary underline">
        {part}
      </mark>
    ),
  );

const Result = ({
  result,
  active,
  onActivate,
  onSelect,
}: {
  result: SortedResult;
  active: boolean;
  onActivate: () => void;
  onSelect: () => void;
}) => {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <button
      ref={ref}
      type="button"
      aria-selected={active}
      onPointerMove={onActivate}
      onClick={onSelect}
      className={cn(
        "relative shrink-0 select-none overflow-hidden rounded-lg px-2.5 py-2 text-start text-sm",
        active && "bg-fd-accent text-fd-accent-foreground",
      )}
    >
      <div className="inline-flex items-center text-xs text-fd-muted-foreground empty:hidden">
        {result.breadcrumbs?.map((crumb, index) => (
          <Fragment key={`${index}-${crumb}`}>
            {index > 0 && <ChevronRight className="size-4 rtl:rotate-180" />}
            {crumb}
          </Fragment>
        ))}
      </div>
      {result.type !== "page" && (
        <div role="none" className="absolute inset-s-3 inset-y-0 w-px bg-fd-border" />
      )}
      {result.type === "heading" && (
        <Hash className="absolute inset-s-6 top-2.5 size-4 text-fd-muted-foreground" />
      )}
      <div
        className={cn(
          "min-w-0",
          result.type === "text" && "ps-4",
          result.type === "heading" && "ps-8",
          result.type === "page" || result.type === "heading"
            ? "font-medium"
            : "text-fd-popover-foreground/80",
        )}
      >
        {highlight(result.content)}
      </div>
    </button>
  );
};

export const SearchDialog = ({
  open,
  onOpenChange,
  dialogHandle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogHandle: Dialog.Handle<unknown>;
}) => {
  const router = useRouter();
  const { search, setSearch, query } = useDocsSearch({ client: fetchClient() });
  const [activeId, setActiveId] = useState<string>();
  const popupRef = useRef<HTMLDivElement>(null);

  // `'empty'` means the query was blank, which is different from a search with no hits
  const results = Array.isArray(query.data) ? query.data : undefined;
  const active = results?.find((result) => result.id === activeId) ?? results?.[0];

  const select = (result: SortedResult) => {
    onOpenChange(false);
    router.push(result.url);
  };

  const onKeyDown = useEffectEvent((event: React.KeyboardEvent) => {
    if (!results?.length || event.nativeEvent.isComposing) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const index = active ? results.indexOf(active) : 0;
      const next = event.key === "ArrowDown" ? index + 1 : index - 1 + results.length;
      setActiveId(results[next % results.length]?.id);
      event.preventDefault();
    }

    if (event.key === "Enter" && active) {
      select(active);
      event.preventDefault();
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} handle={dialogHandle}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-fd-overlay backdrop-blur-xs data-closed:animate-fd-fade-out data-open:animate-fd-fade-in" />
        <Dialog.Popup
          ref={popupRef}
          onKeyDown={onKeyDown}
          initialFocus={() => popupRef.current?.querySelector<HTMLInputElement>(`[${INPUT_ATTR}]`)}
          className="fixed left-1/2 top-4 z-50 w-[calc(100%-1rem)] max-w-(--breakpoint-sm) -translate-x-1/2 overflow-hidden rounded-xl border bg-fd-popover text-fd-popover-foreground shadow-2xl focus-visible:outline-none data-closed:animate-fd-dialog-out data-open:animate-fd-dialog-in md:top-[calc(50%-250px)]"
        >
          <Dialog.Title className="hidden">Search</Dialog.Title>
          <div className="flex flex-row items-center gap-2 border-b p-3">
            <SearchIcon
              className={cn(
                "size-5 text-fd-muted-foreground",
                query.isLoading && "animate-pulse duration-400",
              )}
            />
            <input
              {...{ [INPUT_ATTR]: "" }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documentation"
              className="w-0 flex-1 bg-transparent text-lg placeholder:text-fd-muted-foreground focus-visible:outline-none"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={() => onOpenChange(false)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "font-mono text-fd-muted-foreground",
              )}
            >
              ESC
            </button>
          </div>
          {results && (
            <div className="flex max-h-[460px] w-full flex-col overflow-y-auto p-1">
              {results.length === 0 ? (
                <p className="py-12 text-center text-sm text-fd-muted-foreground">
                  No results found
                </p>
              ) : (
                results.map((result) => (
                  <Result
                    key={result.id}
                    result={result}
                    active={result.id === active?.id}
                    onActivate={() => setActiveId(result.id)}
                    onSelect={() => select(result)}
                  />
                ))
              )}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
