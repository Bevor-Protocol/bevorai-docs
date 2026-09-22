import type { ComponentProps } from "react";

export const Field: React.FC<
  ComponentProps<"div"> & {
    body?: string;
    name?: string;
    type?: string;
    required?: boolean;
    default?: string;
  }
> = ({ body, name, type, required, children, ...props }) => {
  return (
    <div className="my-3 border-l-2 pl-4" {...props}>
      <div className="flex flex-wrap items-baseline gap-2">
        <code className="font-semibold">{name ?? body}</code>
        {type && <span className="text-xs text-fd-muted-foreground">{type}</span>}
        {required && <span className="text-xs font-medium text-red-500">required</span>}
      </div>
      {children && <div className="mt-2 text-sm">{children}</div>}
    </div>
  );
};
