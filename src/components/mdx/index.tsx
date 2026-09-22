import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Callout } from "./callout";
import { Card } from "./card";
import { Expandable } from "./expandable";
import { Field } from "./field";
import { APISchema } from "./inline-openapi";
import { Tab } from "./tab";

const defaultMdxComponents = {
  a: ({ className, ...props }: ComponentProps<"a">) => (
    <a className={cn("font-medium underline underline-offset-4", className)} {...props} />
  ),
  pre: ({ className, ...props }: ComponentProps<"pre">) => (
    <pre className={cn("fd-codeblock", className)} {...props} />
  ),
  table: ({ className, ...props }: ComponentProps<"table">) => (
    <div className="my-6 overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  ),
} satisfies MDXComponents;

export const getMDXComponents = (components?: MDXComponents) => {
  return {
    ...defaultMdxComponents,
    APISchema,
    Warning: (props: ComponentProps<"div">) => <Callout kind="warning" {...props} />,
    Note: (props: ComponentProps<"div">) => <Callout kind="note" {...props} />,
    Info: (props: ComponentProps<"div">) => <Callout kind="info" {...props} />,
    Tip: (props: ComponentProps<"div">) => <Callout kind="tip" {...props} />,
    Check: (props: ComponentProps<"div">) => <Callout kind="success" {...props} />,
    Danger: (props: ComponentProps<"div">) => <Callout kind="danger" {...props} />,
    Card,
    CardGroup: (props: ComponentProps<"div"> & { cols?: number }) => (
      <div className="my-4 grid gap-4 md:grid-cols-2" {...props} />
    ),
    CodeGroup: (props: ComponentProps<"div">) => <div className="my-4 space-y-3" {...props} />,
    Field,
    Expandable,
    AccordionGroup: (props: ComponentProps<"div">) => <div className="my-4 space-y-2" {...props} />,
    Tabs: (props: ComponentProps<"div">) => (
      <div className="my-4 rounded-lg border p-4" {...props} />
    ),
    Tab,
    Steps: (props: ComponentProps<"ol">) => (
      <ol className="my-4 list-decimal space-y-6 pl-6" {...props} />
    ),
    Step: (props: ComponentProps<"li"> & { title?: string }) => <li {...props} />,
    Frame: (props: ComponentProps<"div"> & { caption?: string }) => (
      <figure className="my-6" {...props} />
    ),
    RequestExample: (props: ComponentProps<"div">) => <div className="my-4" {...props} />,
    ResponseExample: (props: ComponentProps<"div">) => <div className="my-4" {...props} />,
    Icon: () => null,
    ...components,
  } satisfies MDXComponents;
};

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
