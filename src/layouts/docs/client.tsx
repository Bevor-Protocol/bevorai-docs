import { TreeContextProvider, useTabsGroups, useTreePath } from "@fumadocs/base-ui/contexts/tree";
import { useIsScrollTop } from "@fumadocs/base-ui/utils/use-is-scroll-top";
import { usePathname } from "fumadocs-core/framework";
import Link from "fumadocs-core/link";
import { type ComponentProps, createContext, type FC, use, useMemo } from "react";
import { cn } from "../../lib/cn";
import type { LinkItemType } from "../shared";
import {
  type BaseSlots,
  type BaseSlotsProps,
  baseSlots,
  isLayoutTabActive,
  type LayoutTab,
  useLinkItems,
} from "../shared";
import type { DocsLayoutProps } from "./index";
import { Container } from "./slots/container";
import { Header } from "./slots/header";
import {
  Sidebar,
  type SidebarProps,
  SidebarProvider,
  type SidebarProviderProps,
  SidebarTrigger,
} from "./slots/sidebar";

export interface DocsSlots extends BaseSlots {
  container: FC<ComponentProps<"div">>;
  header: FC<ComponentProps<"header">>;
  sidebar: {
    provider: FC<SidebarProviderProps>;
    root: FC<SidebarProps>;
    trigger: FC<ComponentProps<"button">>;
  };
}

const { useBaseSlots } = baseSlots({
  useProps() {
    return useDocsLayout().props;
  },
});

interface SlotsProps extends BaseSlotsProps<DocsLayoutProps> {
  tabs: LayoutTab[];
  tabMode: NonNullable<DocsLayoutProps["tabMode"]>;
}

const LayoutContext = createContext<{
  props: SlotsProps;
  isNavTransparent: boolean;
  navItems: LinkItemType[];
  menuItems: LinkItemType[];
  slots: DocsSlots;
} | null>(null);

export function useIsDocsLayout() {
  return use(LayoutContext) !== null;
}

export function useDocsLayout() {
  const context = use(LayoutContext);
  if (!context)
    throw new Error(
      "Please use <DocsPage /> (`fumadocs-ui/layouts/docs/page`) under <DocsLayout /> (`fumadocs-ui/layouts/docs`).",
    );
  return context;
}

export function LayoutBody(
  props: Omit<DocsLayoutProps, "tabs"> & {
    tabs: LayoutTab[];
  },
) {
  const {
    nav: { enabled: navEnabled = true, transparentMode: navTransparentMode = "none" } = {},
    sidebar: { enabled: sidebarEnabled = true, defaultOpenLevel, prefetch, ...sidebarProps } = {},
    slots: defaultSlots,
    tabs,
    tabMode = "auto",
    tree,
    containerProps,
    children,
  } = props;
  const isTop = useIsScrollTop({ enabled: navTransparentMode === "top" }) ?? true;
  const isNavTransparent = navTransparentMode === "top" ? isTop : navTransparentMode === "always";
  const { baseSlots, baseProps } = useBaseSlots(props);
  const linkItems = useLinkItems(props);
  const slots: DocsSlots = {
    ...baseSlots,
    header: defaultSlots?.header ?? Header,
    container: defaultSlots?.container ?? Container,
    sidebar: defaultSlots?.sidebar ?? {
      provider: SidebarProvider,
      root: Sidebar,
      trigger: SidebarTrigger,
    },
  };

  return (
    <TreeContextProvider tree={tree}>
      <LayoutContext
        value={{
          props: {
            tabMode,
            tabs,
            ...baseProps,
          },
          isNavTransparent,
          slots,
          ...linkItems,
        }}
      >
        <slots.sidebar.provider defaultOpenLevel={defaultOpenLevel} prefetch={prefetch}>
          <slots.container {...containerProps}>
            {navEnabled && <slots.header />}
            {sidebarEnabled && <slots.sidebar.root {...sidebarProps} />}
            {children}
          </slots.container>
        </slots.sidebar.provider>
      </LayoutContext>
    </TreeContextProvider>
  );
}

export function LayoutTabs({
  tabs: allTabs,
  ...props
}: ComponentProps<"div"> & {
  tabs: LayoutTab[];
}) {
  const pathname = usePathname();
  const path = useTreePath();
  const group = useTabsGroups(allTabs).findLast((group) => typeof group.active?.root !== "string");
  const selected = useMemo(() => {
    return group?.options.findLast((option) => isLayoutTabActive(option, path, pathname));
  }, [group, path, pathname]);
  if (!group) return;

  return (
    <div
      {...props}
      className={cn("flex flex-row items-stretch gap-6 overflow-auto", props.className)}
    >
      {group.options.map((tab, i) => (
        <Link
          key={i}
          href={tab.url}
          className={cn(
            // the -1px bottom margin lets the active underline overlap the header's border
            "inline-flex border-b-2 border-transparent transition-colors items-center -mb-px font-medium gap-2 text-fd-muted-foreground text-sm text-nowrap hover:text-fd-accent-foreground",
            tab.unlisted && selected !== tab && "hidden",
            selected === tab && "border-fd-primary text-fd-primary",
          )}
        >
          {tab.title}
        </Link>
      ))}
    </div>
  );
}
