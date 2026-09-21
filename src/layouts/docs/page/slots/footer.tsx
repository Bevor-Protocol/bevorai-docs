import { usePathname } from "fumadocs-core/framework";
import Link from "fumadocs-core/link";
import type * as PageTree from "fumadocs-core/page-tree";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ComponentProps, useMemo } from "react";
import { useFooterItems } from "@/hooks/use-footer-items";
import { cn } from "../../../../lib/cn";
import { isActive } from "../../../../lib/urls";

type Item = Pick<PageTree.Item, "name" | "description" | "url">;

export interface FooterProps extends ComponentProps<"div"> {
  /**
   * Items including information for the next and previous page
   */
  items?: {
    previous?: Item;
    next?: Item;
  };
}

export function Footer({ items, children, className, ...props }: FooterProps) {
  const footerList = useFooterItems();
  const pathname = usePathname();
  const { previous, next } = useMemo(() => {
    if (items) return items;

    const idx = footerList.findIndex((item) => isActive(item.url, pathname));

    if (idx === -1) return {};
    return {
      previous: footerList[idx - 1],
      next: footerList[idx + 1],
    };
  }, [footerList, items, pathname]);

  return (
    <>
      <div
        className={cn(
          "@container grid gap-4",
          previous && next ? "grid-cols-2" : "grid-cols-1",
          className,
        )}
        {...props}
      >
        {previous && <FooterItem item={previous} index={0} />}
        {next && <FooterItem item={next} index={1} />}
      </div>
      {children}
    </>
  );
}

function FooterItem({ item, index }: { item: Item; index: 0 | 1 }) {
  const Icon = index === 0 ? ChevronLeft : ChevronRight;

  return (
    <Link
      href={item.url}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium [&_.fd-page-tree-item-name]:items-baseline! @max-lg:col-span-full",
        index === 1 && "flex-row-reverse text-end",
        "text-fd-accent-foreground/80",
        "transition-colors hover:text-fd-accent-foreground",
      )}
    >
      <Icon className="-mx-1 size-4 shrink-0 rtl:rotate-180" />
      <p>{item.name}</p>
    </Link>
  );
}
