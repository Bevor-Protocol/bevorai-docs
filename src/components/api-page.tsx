import { createOpenAPIPage } from "fumadocs-openapi/ui";
import PlaygroundClient from "@/components/api/playground";
import { AuthProvider } from "@/components/api/playground/auth";
import { ResponseTabs } from "@/components/api/response-tabs";
import { Schema } from "@/components/api/schema";
import { UsageTabs } from "@/components/api/usage-tabs";

export const OpenAPIPage = createOpenAPIPage({
  playground: {
    provider: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    render: ({ path, method, operation, pathItem, ctx }) => (
      <PlaygroundClient
        route={path}
        method={method}
        operation={operation}
        pathItem={pathItem}
        writeOnly
        readOnly={false}
      />
    ),
  },
  schemaUI: {
    render: (options) => <Schema {...options} />,
  },
  content: {
    renderAPIExampleUsageTabs: (registry, ctx) => <UsageTabs registry={registry} ctx={ctx} />,
    renderResponseTabs: (options, ctx) => <ResponseTabs options={options} ctx={ctx} />,
    renderOperationLayout(slots, { operation }) {
      return (
        <div className="flex flex-col gap-x-6 gap-y-4 @4xl:flex-row @4xl:items-start">
          <div className="min-w-0 flex-1">
            {operation.summary && (
              <h1 className="mb-2 text-[1.75em] font-semibold">{operation.summary}</h1>
            )}
            {slots.description}
            {slots.header}
            {slots.apiPlayground}
            <hr />
            {slots.authSchemes}
            <hr />
            {slots.parameters}
            {slots.parameters && <hr />}
            {slots.body}
            {slots.body && <hr />}
            {slots.responses}
            {slots.callbacks}
          </div>
          <div className="@4xl:sticky @4xl:top-[calc(var(--fd-docs-row-1,2rem)+1rem)] @4xl:w-[400px]">
            {slots.apiExample}
          </div>
        </div>
      );
    },
  },
});
