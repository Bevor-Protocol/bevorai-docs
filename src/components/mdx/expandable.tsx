import type { ComponentProps } from "react";

export const Expandable: React.FC<ComponentProps<"div"> & { title?: string }> = ({
  title,
  children,
  ...props
}) => {
  return (
    <details className="my-3 rounded-lg border p-3">
      <summary className="cursor-pointer font-medium">{title ?? "Details"}</summary>
      <div className="mt-3" {...props}>
        {children}
      </div>
    </details>
  );
};
