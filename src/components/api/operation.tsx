import type { JsonSchema } from "@fumadocs/json-schema";
import { useComponents } from "fumadocs-openapi";
import {
  type OperationParameters,
  OperationProvider,
  type PageOperationProps,
  useOperation,
  useResponseExamples,
} from "fumadocs-openapi/operation";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { Badge, getMethodColor } from "@/components/api/playground/method-label";
import { ResponseTabs } from "@/components/api/response-tabs";
import { UsageTabs } from "@/components/api/usage-tabs";

export function Operation(props: PageOperationProps) {
  return (
    <OperationProvider {...props}>
      <Content showTitle={props.showTitle} showDescription={props.showDescription} />
    </OperationProvider>
  );
}

function HighlightedPath({
  path,
  parameters,
}: {
  path: string;
  parameters: OperationParameters[]; // operation.parameters
}) {
  const pathParamNames = new Set(
    parameters.find((group) => group.in === "path")?.items.map((p) => p.name) ?? [],
  );

  const parts = path.split(/(\{[^}]+\})/g);
  return parts.map((part, i) => {
    const name = part.startsWith("{") && part.endsWith("}") ? part.slice(1, -1) : null;
    return name && pathParamNames.has(name) ? (
      <span key={i} className="text-fd-primary font-medium">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}

function Content({
  showTitle = true,
  showDescription = true,
}: Pick<PageOperationProps, "showTitle" | "showDescription">) {
  const {
    type,
    path,
    method,
    operation,
    title,
    description,
    parameters,
    requestBody,
    security,
    responses,
    callbacks,
  } = useOperation();
  const { Markdown } = useComponents();
  const responseExamples = useResponseExamples();

  return (
    // the two columns are grid items of the page grid in `api-page.tsx`, so that the footer
    // rendered there can sit under the content column alone
    <>
      <article className="min-w-0">
        {showTitle && (
          <div className="mb-4 flex items-center justify-start gap-6">
            <h2 id={title} className="m-0 scroll-m-24 text-2xl font-semibold">
              {title}
            </h2>
            {operation.deprecated && (
              <Badge size="sm" color="yellow">
                Deprecated
              </Badge>
            )}
          </div>
        )}

        <div className="not-prose mb-6 flex items-center gap-2 py-3">
          <Badge size="sm" color={getMethodColor(method)}>
            {method.toUpperCase()}
          </Badge>
          <code className="min-w-0 overflow-x-auto text-sm text-fd-muted-foreground">
            <HighlightedPath path={path} parameters={parameters} />
          </code>
        </div>

        {showDescription && description && (
          <div className="mb-8">
            <Markdown md={description} />
          </div>
        )}

        {security.length > 0 && (
          <section className="mt-10 not-prose">
            <h3 id="authorization" className="scroll-m-24 text-xl font-semibold">
              Authorization
            </h3>
            <div className="space-y-3">
              {security.map((requirement, index) => (
                <div key={index} className="py-3 text-sm">
                  {requirement.map(({ key, scopes, scheme }) => (
                    <div key={key}>
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="font-semibold text-fd-primary">{key}</code>
                        {scheme?.type && (
                          <span className="text-xs text-fd-muted-foreground">{scheme.type}</span>
                        )}
                      </div>
                      {scheme?.description && <Markdown md={scheme.description} />}
                      {scopes.length > 0 && (
                        <p className="text-xs text-fd-muted-foreground">
                          Scopes: {scopes.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {parameters.map(({ in: location, items }) => (
          <section key={location} className="mt-10 not-prose">
            <h3 id={`parameters-${location}`} className="scroll-m-24 text-xl font-semibold">
              {location[0].toUpperCase()}
              {location.slice(1)} parameters
            </h3>
            <div className="divide-y py-3 text-sm">
              {items.map((parameter) => (
                <Fragment key={parameter.name}>
                  {parameter.schema && (
                    <SchemaBlock
                      name={parameter.name ?? "parameter"}
                      root={parameter.schema}
                      description={parameter.description}
                      required={parameter.required}
                      readOnly={method === "get"}
                      writeOnly={method !== "get"}
                    />
                  )}
                </Fragment>
              ))}
            </div>
          </section>
        ))}

        {requestBody && (
          <section className="mt-10 not-prose">
            <div className="flex items-center gap-2">
              <h3 id="request-body" className="scroll-m-24 text-xl font-semibold">
                Request body
              </h3>
              {Object.keys(requestBody.content).length > 0 && (
                <code className="text-xs text-fd-muted-foreground">
                  {Object.keys(requestBody.content).join(", ")}
                </code>
              )}
            </div>
            {requestBody.description && <Markdown md={requestBody.description} />}
            <div className="space-y-4">
              {Object.entries(requestBody.content).map(([mediaType, media]) => (
                <div key={mediaType} className="py-3 text-sm">
                  {media.schema && (
                    <SchemaBlock
                      name="body"
                      root={media.schema}
                      required={requestBody.required}
                      as="body"
                      writeOnly
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {responses.length > 0 && (
          <section className="mt-10 not-prose">
            <h3 id="response-body" className="scroll-m-24 text-xl font-semibold">
              {responses.length === 1 ? "Response" : "Responses"}
            </h3>
            <div className="space-y-4">
              {responses.length === 1
                ? (() => {
                    const { status, content } = responses[0];
                    return (
                      <div className="py-3 text-sm">
                        <div className="flex items-center gap-2 font-mono font-semibold">
                          {status}
                          {Object.keys(content).length > 0 && (
                            <code className="text-xs font-normal text-fd-muted-foreground">
                              {Object.keys(content).join(", ")}
                            </code>
                          )}
                        </div>
                        {Object.entries(content).map(([mediaType, media]) => (
                          <div key={mediaType} className="mt-4">
                            {media.schema && (
                              <SchemaBlock name="response" root={media.schema} as="body" readOnly />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                : responses.map(({ status, content }) => (
                    <details key={status} className="group py-3 text-sm">
                      <summary className="flex cursor-pointer list-none items-center gap-2 font-mono font-semibold">
                        <ChevronRight className="size-4 shrink-0 text-fd-muted-foreground transition-transform group-open:rotate-90" />
                        {status}
                        {Object.keys(content).length > 0 && (
                          <code className="text-xs font-normal text-fd-muted-foreground">
                            {Object.keys(content).join(", ")}
                          </code>
                        )}
                      </summary>
                      {Object.entries(content).map(([mediaType, media]) => (
                        <div key={mediaType} className="mt-4">
                          {media.schema && (
                            <SchemaBlock name="response" root={media.schema} as="body" readOnly />
                          )}
                        </div>
                      ))}
                    </details>
                  ))}
            </div>
          </section>
        )}

        {callbacks.length > 0 && (
          <section className="mt-10">
            <h3 id="callbacks" className="scroll-m-24 text-xl font-semibold">
              Callbacks
            </h3>
            {callbacks.map((callback) => (
              <Operation
                key={`${callback.name}:${callback.path}:${callback.method}`}
                type="webhook"
                path={callback.path}
                method={callback.method}
                pathItem={callback.pathItem}
                operation={callback.operation}
              />
            ))}
          </section>
        )}
      </article>
      <aside className="min-w-0 @max-4xl:mt-8">
        <div className="space-y-4 @4xl:sticky @4xl:top-(--fd-docs-row-2) @4xl:py-6">
          {type === "operation" && <UsageTabs />}
          {responseExamples.length > 0 && <ResponseTabs tabs={responseExamples} />}
        </div>
      </aside>
    </>
  );
}

function SchemaBlock({
  name,
  root,
  description,
  required,
  as = "property",
  readOnly,
  writeOnly,
}: {
  name: string;
  root: JsonSchema;
  description?: string;
  required?: boolean;
  as?: "property" | "body";
  readOnly?: boolean;
  writeOnly?: boolean;
}) {
  const { SchemaUI, Markdown, CodeBlock } = useComponents();
  const schema =
    description && typeof root === "object" ? { ...root, description: description } : root;

  return (
    <SchemaUI
      root={schema}
      client={{ name, rootId: name, required, as }}
      readOnly={readOnly}
      writeOnly={writeOnly}
      renderMarkdown={(md) => <Markdown md={md} />}
      renderCodeblock={(props) => <CodeBlock {...props} />}
    />
  );
}
