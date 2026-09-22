import type { ComponentProps } from "react";

export const Callout: React.FC<
  ComponentProps<"div"> & {
    kind: string;
  }
> = ({ children, kind = "note", ...props }) => {
  return (
    <div className="my-4 rounded-lg border bg-fd-card p-4" {...props}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">
        {kind}
      </p>
      <div className="text-sm *:first:mt-0 *:last:mb-0">{children}</div>
    </div>
  );
};
