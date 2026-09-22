import type { ComponentProps } from "react";

export const Card: React.FC<
  ComponentProps<"div"> & {
    title?: string;
    href?: string;
    icon?: string;
  }
> = ({ title, href, children }) => {
  return href ? (
    <a
      className="block rounded-xl border p-4 transition-colors hover:bg-fd-accent no-underline"
      href={href}
    >
      {title && <div className="font-semibold underline">{title}</div>}
      <div className="mt-1 text-sm text-fd-muted-foreground">{children}</div>
    </a>
  ) : (
    <div className="rounded-xl border p-4">
      {title && <div className="font-semibold">{title}</div>}
      <div className="mt-1 text-sm text-fd-muted-foreground">{children}</div>
    </div>
  );
};
