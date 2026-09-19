'use client';

import type { ComponentProps } from 'react';
import { LayoutTabs, useDocsLayout } from '../client';
import { cn } from '../../../lib/cn';
import { SidebarIcon } from 'lucide-react';
import { buttonVariants } from '../../../components/ui/button';
import { LinkItem, type LinkItemType } from '../../shared';

type NavLink = Extract<LinkItemType, { url: string }>;

const hasUrl = (item: LinkItemType): item is NavLink =>
  item.type !== 'custom' && typeof (item as { url?: unknown }).url === 'string';

const weight = (type: NavLink['type']) => (type === 'main' ? 0 : type === 'icon' ? 1 : 2);

/**
 * Matches the grid in `slots/container.tsx`: the bar itself is full-bleed so its border and
 * backdrop span the viewport, but its rows line up with the sidebar and content columns.
 * `px-6` matches the sidebar viewport's `p-4` plus the depth-0 item offset.
 */
const row = 'w-full mx-auto max-w-[var(--fd-layout-width,97rem)] px-6';

export function Header(props: ComponentProps<'header'>) {
  const {
    isNavTransparent,
    navItems,
    slots,
    props: { nav, tabs },
  } = useDocsLayout();

  if (nav?.component) return nav.component;
  // icons sit between the plain links and the CTA so the primary button stays last
  const links = navItems
    .filter(hasUrl)
    .toSorted((a, b) => weight(a.type ?? 'main') - weight(b.type ?? 'main'));

  return (
    <header
      id="nd-subnav"
      data-transparent={isNavTransparent}
      {...props}
      className={cn(
        '[grid-area:header] sticky top-(--fd-docs-row-1) z-30 flex flex-col border-b transition-colors backdrop-blur-sm h-(--fd-header-height) layout:[--fd-header-height:--spacing(14)] md:layout:[--fd-header-height:--spacing(26)] data-[transparent=false]:bg-fd-background/80',
        props.className,
      )}
    >
      <div className={cn(row, 'flex h-14 shrink-0 items-center gap-2')}>
        {slots.navTitle && (
          <slots.navTitle className="inline-flex items-center gap-2.5 font-semibold me-4" />
        )}
        {nav?.children}
        {slots.searchTrigger && (
          <slots.searchTrigger.full
            hideIfDisabled
            className="mx-auto hidden w-full max-w-sm max-lg:max-w-56 md:flex"
          />
        )}
        <div className="flex items-center gap-1.5 ms-auto">
          {links.map((item, i) =>
            item.type === 'icon' ? (
              <LinkItem
                key={i}
                item={item}
                aria-label={item.label}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                  'text-fd-muted-foreground max-md:hidden',
                )}
              >
                {item.icon}
              </LinkItem>
            ) : (
              <LinkItem
                key={i}
                item={item}
                className={cn(
                  buttonVariants({
                    variant: item.type === 'button' ? 'primary' : 'ghost',
                    size: 'sm',
                  }),
                  'max-md:hidden gap-1.5',
                  item.type !== 'button' && 'text-fd-muted-foreground',
                )}
              >
                {item.icon}
                {item.text}
              </LinkItem>
            ),
          )}
          {slots.themeSwitch && <slots.themeSwitch className="max-md:hidden" />}
          {slots.searchTrigger && <slots.searchTrigger.sm hideIfDisabled className="md:hidden" />}
          {slots.sidebar && (
            <slots.sidebar.trigger
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'md:hidden')}
            >
              <SidebarIcon />
            </slots.sidebar.trigger>
          )}
        </div>
      </div>
      {tabs.length > 0 && (
        <LayoutTabs tabs={tabs} className={cn(row, 'h-12 max-md:hidden')} />
      )}
    </header>
  );
}
