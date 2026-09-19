import defaultMdxComponents from "@fumadocs/base-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";

type BoxProps = ComponentProps<"div">;
type FieldProps = BoxProps & {
  body?: string;
  name?: string;
  type?: string;
  required?: boolean;
  default?: string;
};

const Callout = ({
  children,
  kind = "note",
  ...props
}: {
  kind?: string;
} & BoxProps) => {
  return (
    <div className="my-4 rounded-lg border bg-fd-card p-4" {...props}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">
        {kind}
      </p>
      <div className="text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">{children}</div>
    </div>
  );
};

const Card = ({
  title,
  href,
  children,
}: BoxProps & { title?: string; href?: string; icon?: string }) => {
  const content = (
    <>
      {title && <div className="font-semibold">{title}</div>}
      <div className="mt-1 text-sm text-fd-muted-foreground">{children}</div>
    </>
  );

  return href ? (
    <a className="block rounded-xl border p-4 transition-colors hover:bg-fd-accent" href={href}>
      {content}
    </a>
  ) : (
    <div className="rounded-xl border p-4">{content}</div>
  );
};

const Field = ({ body, name, type, required, children, ...props }: FieldProps) => {
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

const Expandable = ({ title, children }: BoxProps & { title?: string }) => {
  return (
    <details className="my-3 rounded-lg border p-3">
      <summary className="cursor-pointer font-medium">{title ?? "Details"}</summary>
      <div className="mt-3">{children}</div>
    </details>
  );
};

const Tab = ({ title, children }: BoxProps & { title?: string }) => {
  return (
    <section className="my-3">
      {title && <h4 className="mb-2 text-sm font-semibold">{title}</h4>}
      {children}
    </section>
  );
};

export const getMDXComponents = (components?: MDXComponents) => {
  return {
    ...defaultMdxComponents,
    Warning: (props: BoxProps) => <Callout kind="warning" {...props} />,
    Note: (props: BoxProps) => <Callout kind="note" {...props} />,
    Info: (props: BoxProps) => <Callout kind="info" {...props} />,
    Tip: (props: BoxProps) => <Callout kind="tip" {...props} />,
    Check: (props: BoxProps) => <Callout kind="success" {...props} />,
    Danger: (props: BoxProps) => <Callout kind="danger" {...props} />,
    Card,
    CardGroup: (props: BoxProps & { cols?: number }) => (
      <div className="my-4 grid gap-4 md:grid-cols-2" {...props} />
    ),
    CodeGroup: (props: BoxProps) => <div className="my-4 space-y-3" {...props} />,
    ParamField: Field,
    ResponseField: Field,
    Expandable,
    Accordion: Expandable,
    AccordionGroup: (props: BoxProps) => <div className="my-4 space-y-2" {...props} />,
    Tabs: (props: BoxProps) => <div className="my-4 rounded-lg border p-4" {...props} />,
    Tab,
    Steps: (props: ComponentProps<"ol">) => (
      <ol className="my-4 list-decimal space-y-6 pl-6" {...props} />
    ),
    Step: (props: ComponentProps<"li"> & { title?: string }) => <li {...props} />,
    Frame: (props: BoxProps & { caption?: string }) => <figure className="my-6" {...props} />,
    RequestExample: (props: BoxProps) => <div className="my-4" {...props} />,
    ResponseExample: (props: BoxProps) => <div className="my-4" {...props} />,
    Icon: () => null,
    ...components,
  } satisfies MDXComponents;
};

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
