import type { ComponentProps } from "react";

export const Tab: React.FC<ComponentProps<"section"> & { title?: string }> = ({
  title,
  children,
  ...props
}) => {
  return (
    <section className="my-3" {...props}>
      {title && <h4 className="mb-2 text-sm font-semibold">{title}</h4>}
      {children}
    </section>
  );
};
