import { cva } from "class-variance-authority";
import { ChevronDown, Languages, SidebarIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import * as Base from "../../../components/docs-sidebar/base";
import { createLinkItemRenderer } from "../../../components/docs-sidebar/link-item";
import {
  createPageTreeRenderer,
  type SidebarPageTreeComponents,
} from "../../../components/docs-sidebar/page-tree";
import { SidebarTabsDropdown } from "../../../components/docs-sidebar/tabs-dropdown";
import { buttonVariants } from "../../../components/ui/button";
import { cn } from "../../../lib/cn";
import { LinkItem } from "../../shared";
import { useDocsLayout } from "../client";

const itemVariants = cva(
  "relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        link: "transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary data-[active=true]:hover:transition-colors",
        button:
          "transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none",
      },
      highlight: {
        true: "data-[active=true]:before:content-[''] data-[active=true]:before:bg-fd-primary data-[active=true]:before:absolute data-[active=true]:before:w-px data-[active=true]:before:inset-y-2.5 data-[active=true]:before:inset-s-2.5",
      },
    },
  },
);

export interface SidebarProps extends ComponentProps<"aside"> {
  components?: Partial<SidebarPageTreeComponents>;
  banner?: ReactNode;
  footer?: ReactNode;
}

export type SidebarProviderProps = Base.SidebarProviderProps;

export const { useSidebar } = Base;

export function SidebarProvider(props: SidebarProviderProps) {
  return <Base.SidebarProvider {...props} />;
}

export function Sidebar({ footer, banner, components, ...rest }: SidebarProps) {
  const {
    menuItems,
    slots,
    props: { tabs },
  } = useDocsLayout();
  const iconLinks = menuItems.filter((item) => item.type === "icon");

  // On desktop the nav links, search, and theme switch all live in the header, so the sidebar is
  // only the page tree. The drawer has no header to fall back on and keeps the full menu.
  const pageTree = (
    <Base.SidebarViewport>
      <div className="flex flex-col gap-0.5">
        <SidebarPageTree {...components} />
      </div>
    </Base.SidebarViewport>
  );

  return (
    <>
      <SidebarContent {...rest}>
        <div className="flex flex-col gap-3 px-4 pb-2 empty:hidden">{banner}</div>
        {pageTree}
        <div className="flex flex-col px-4 pb-4 empty:hidden">
          {slots.languageSelect && (
            <slots.languageSelect.root
              variant="secondary"
              className="text-fd-muted-foreground text-start justify-start bg-fd-secondary/50"
            >
              <Languages className="size-4.5" />
              <slots.languageSelect.text />
              <ChevronDown className="ms-auto size-3.5" />
            </slots.languageSelect.root>
          )}
          {footer}
        </div>
      </SidebarContent>
      <SidebarDrawer>
        <div className="flex flex-col gap-3 p-4 pb-2">
          <div className="flex text-fd-muted-foreground items-center gap-1.5">
            <div className="flex flex-1">
              {iconLinks.map((item, i) => (
                <LinkItem
                  key={i}
                  item={item}
                  className={cn(
                    buttonVariants({
                      size: "icon-sm",
                      variant: "ghost",
                      className: "p-2",
                    }),
                  )}
                  aria-label={item.label}
                >
                  {item.icon}
                </LinkItem>
              ))}
            </div>
            {slots.languageSelect && (
              <slots.languageSelect.root>
                <Languages className="size-4.5" />
                <slots.languageSelect.text />
              </slots.languageSelect.root>
            )}
            {slots.themeSwitch && <slots.themeSwitch className="p-0" />}
            <SidebarTrigger
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  size: "icon-sm",
                  className: "p-2",
                }),
              )}
            >
              <SidebarIcon />
            </SidebarTrigger>
          </div>
          {tabs.length > 0 && <SidebarTabsDropdown options={tabs} />}
          {banner}
        </div>
        <Base.SidebarViewport>
          <div className="flex flex-col gap-0.5">
            {menuItems
              .filter((v) => v.type !== "icon")
              .map((item, i, list) => (
                <SidebarLinkItem
                  key={i}
                  item={item}
                  className={cn(i === list.length - 1 && "mb-4")}
                />
              ))}
            <SidebarPageTree {...components} />
          </div>
        </Base.SidebarViewport>
        <div className="flex flex-col border-t p-4 pt-2 empty:hidden">{footer}</div>
      </SidebarDrawer>
    </>
  );
}

function SidebarFolder(props: ComponentProps<typeof Base.SidebarFolder>) {
  return <Base.SidebarFolder {...props} />;
}

export function SidebarTrigger(props: ComponentProps<"button">) {
  return <Base.SidebarTrigger {...props} />;
}

/**
 * A static nav column on desktop — not collapsible. Below `md` the page tree moves into the
 * drawer, which the header's trigger opens.
 */
function SidebarContent({ className, children, ...props }: ComponentProps<"aside">) {
  const { mode } = Base.useSidebar();
  if (mode !== "full") return null;

  return (
    <div
      data-sidebar-placeholder=""
      className="sticky top-(--fd-docs-row-2) z-20 flex justify-end [grid-area:sidebar] h-[calc(var(--fd-docs-height)-var(--fd-docs-row-2))] md:layout:[--fd-sidebar-width:268px] max-md:hidden"
    >
      <aside
        id="nd-sidebar"
        className={cn(
          // top padding mirrors the article's, so the first tree item lines up with the page title
          "flex flex-col w-(--fd-sidebar-width) text-sm pt-2 md:pt-4 xl:pt-10",
          className,
        )}
        {...props}
      >
        {children}
      </aside>
    </div>
  );
}

function SidebarDrawer({
  children,
  className,
  ...props
}: ComponentProps<typeof Base.SidebarDrawerContent>) {
  return (
    <>
      <Base.SidebarDrawerOverlay className="fixed z-40 inset-0 backdrop-blur-xs data-[state=open]:animate-fd-fade-in data-[state=closed]:animate-fd-fade-out" />
      <Base.SidebarDrawerContent
        className={cn(
          "fixed text-[0.9375rem] flex flex-col shadow-lg border-s inset-e-0 inset-y-0 w-[85%] max-w-95 z-40 bg-fd-background data-[state=open]:animate-fd-sidebar-in data-[state=closed]:animate-fd-sidebar-out",
          className,
        )}
        {...props}
      >
        {children}
      </Base.SidebarDrawerContent>
    </>
  );
}

function SidebarSeparator({ className, style, children, ...props }: ComponentProps<"p">) {
  const depth = Base.useFolderDepth();

  return (
    <Base.SidebarSeparator
      className={cn(
        "inline-flex items-center gap-2 mb-1 px-2 mt-6 empty:mb-0 [&_svg]:size-4 [&_svg]:shrink-0",
        depth === 0 && "first:mt-0",
        className,
      )}
      style={{
        paddingInlineStart: getItemOffset(depth),
        ...style,
      }}
      {...props}
    >
      {children}
    </Base.SidebarSeparator>
  );
}

function SidebarItem({
  className,
  style,
  children,
  ...props
}: ComponentProps<typeof Base.SidebarItem>) {
  const depth = Base.useFolderDepth();

  return (
    <Base.SidebarItem
      className={cn(itemVariants({ variant: "link", highlight: depth >= 1 }), className)}
      style={{
        paddingInlineStart: getItemOffset(depth),
        ...style,
      }}
      {...props}
    >
      {children}
    </Base.SidebarItem>
  );
}

function SidebarFolderTrigger({
  className,
  style,
  ...props
}: ComponentProps<typeof Base.SidebarFolderTrigger>) {
  const { depth, collapsible } = Base.useFolder()!;

  return (
    <Base.SidebarFolderTrigger
      className={(state) =>
        cn(
          itemVariants({ variant: collapsible ? "button" : null }),
          "w-full",
          typeof className === "function" ? className(state) : className,
        )
      }
      style={{
        paddingInlineStart: getItemOffset(depth - 1),
        ...style,
      }}
      {...props}
    >
      {props.children}
    </Base.SidebarFolderTrigger>
  );
}

function SidebarFolderLink({
  className,
  style,
  ...props
}: ComponentProps<typeof Base.SidebarFolderLink>) {
  const depth = Base.useFolderDepth();

  return (
    <Base.SidebarFolderLink
      className={cn(itemVariants({ variant: "link", highlight: depth > 1 }), "w-full", className)}
      style={{
        paddingInlineStart: getItemOffset(depth - 1),
        ...style,
      }}
      {...props}
    >
      {props.children}
    </Base.SidebarFolderLink>
  );
}

function SidebarFolderContent({
  className,
  children,
  ...props
}: ComponentProps<typeof Base.SidebarFolderContent>) {
  const depth = Base.useFolderDepth();

  return (
    <Base.SidebarFolderContent
      className={(state) =>
        cn(
          "relative flex flex-col gap-0.5 pt-0.5",
          depth === 1 &&
            "before:content-[''] before:absolute before:w-px before:inset-y-1 before:bg-fd-border before:inset-s-2.5",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    >
      {children}
    </Base.SidebarFolderContent>
  );
}

function getItemOffset(depth: number) {
  return `calc(${2 + 3 * depth} * var(--spacing))`;
}

const SidebarPageTree = createPageTreeRenderer({
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarItem,
  SidebarSeparator,
});

const SidebarLinkItem = createLinkItemRenderer({
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarItem,
});
