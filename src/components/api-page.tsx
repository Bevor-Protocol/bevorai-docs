import { createOpenAPIRenderer, type PageLayoutProps } from "fumadocs-openapi";
import { type ComponentProps, createElement, Fragment } from "react";
import { Schema } from "@/components/api/schema";
import { Footer } from "@/layouts/docs/page/slots/footer";
import { Operation } from "./api/operation";
import { ClientCodeBlock } from "./api/playground/codeblock";

const Markdown = ({ md }: { md: string }) => (
  <div className="whitespace-pre-wrap text-sm leading-7">{md}</div>
);

const Heading = ({
  depth,
  ref: _ref,
  ...props
}: ComponentProps<"h1"> & { id: string; depth: number }) => {
  const tag = `h${Math.min(Math.max(depth, 1), 6)}`;
  return createElement(tag, props);
};

/*
 * Each operation contributes an article and an examples aside, which land in the two columns
 * below. The columns are a container query so they follow the space the sidebars leave over
 * rather than the viewport. The page footer is rendered here, in the content column, instead of
 * by `DocsPage`, where it would stretch under the examples column too.
 */
const Layout = ({ operations, webhooks }: PageLayoutProps) => (
  <div className="@container">
    <div className="grid gap-x-8 @4xl:grid-cols-[minmax(0,1fr)_minmax(320px,500px)]">
      {operations?.map(({ item, children }) => (
        <Fragment key={`${item.path}:${item.method}`}>{children}</Fragment>
      ))}
      {webhooks?.map(({ item, children }) => (
        <Fragment key={`${item.name}:${item.method}`}>{children}</Fragment>
      ))}
      <Footer className="mt-12 border-t pt-6 @4xl:col-start-1" />
    </div>
  </div>
);

export const OpenAPIPage = createOpenAPIRenderer({
  shikiOptions: {
    themes: {
      light: "light-plus",
      dark: "dark-plus",
    },
    defaultColor: false,
  },
  components: {
    Operation,
    SchemaUI: Schema,
    CodeBlock: ClientCodeBlock,
    Markdown,
    Heading,
    Layout,
  },
});
