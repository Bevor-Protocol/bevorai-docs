import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fumadocs/api-docs/components/select";
import { cn } from "cn";
import type { HttpMethods, OperationObject, ParameterObject } from "fumadocs-openapi";
import type { InlineCodeUsageGenerator } from "fumadocs-openapi/requests/generators";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Fragment } from "react/jsx-runtime";
import type { Doc } from "@/hooks/use-doc";
import { Markdown } from "../ui/markdown";
import { CopyButton } from "./copy-button";
import { ClientCodeBlock } from "./playground/codeblock";
import { synthesizeExample } from "./registry";
import { SchemaBlock } from "./schema/client";

export const Security = ({
  security,
  doc,
}: {
  security?: OperationObject["security"];
  doc: Doc;
}) => {
  if (!security || security.length === 0) return null;
  const schemes = doc.dereferenced.components?.securitySchemes;

  return (
    <section className="mt-10 not-prose">
      <h3 id="authorization" className="scroll-m-24 text-xl font-semibold">
        Authorization
      </h3>
      <div className="space-y-3">
        {security.map((requirement, index) => {
          const entries = Object.entries(requirement);
          if (entries.length === 0) return null;
          return (
            <div key={index} className="py-3 text-sm">
              {entries.map(([key, scopes]) => {
                const scheme = doc.resolve(schemes?.[key]);
                return (
                  <div key={key}>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="font-semibold text-fd-primary">{key}</code>
                      {scheme?.type && (
                        <span className="text-xs text-fd-muted-foreground">{scheme.type}</span>
                      )}
                    </div>
                    {scheme?.description && <Markdown>{scheme.description}</Markdown>}
                    {Array.isArray(scopes) && scopes.length > 0 && (
                      <p className="text-xs text-fd-muted-foreground">
                        Scopes: {scopes.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const Parameters = ({
  parameters,
  method,
  doc,
}: {
  parameters: ParameterObject[];
  method: HttpMethods;
  doc: Doc;
}) => (
  <>
    {(["path", "query", "header", "cookie"] as const).map((location) => {
      const items = parameters.filter((p) => p.in === location);
      if (items.length === 0) return null;
      return (
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
                    bundled={doc.bundled}
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
      );
    })}
  </>
);

export const RequestBody = ({
  requestBody: raw,
  doc,
}: {
  requestBody?: OperationObject["requestBody"];
  doc: Doc;
}) => {
  if (!raw) return null;
  const body = doc.resolve(raw);
  if (!body?.content || Object.keys(body.content).length === 0) return null;

  return (
    <section className="mt-10 not-prose">
      <div className="flex items-center gap-2">
        <h3 id="request-body" className="scroll-m-24 text-xl font-semibold">
          Request body
        </h3>
        <code className="text-xs text-fd-muted-foreground">
          {Object.keys(body.content).join(", ")}
        </code>
      </div>
      {body.description && <Markdown>{body.description}</Markdown>}
      <div className="space-y-4">
        {Object.entries(body.content).map(([mediaType, rawMedia]) => {
          const media = doc.resolve(rawMedia);
          return (
            <div key={mediaType} className="py-3 text-sm">
              {media.schema && (
                <SchemaBlock
                  name="body"
                  root={media.schema}
                  required={body.required}
                  bundled={doc.bundled}
                  writeOnly
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const ResponseBodyContent = ({
  content,
  doc,
}: {
  content: Record<string, any>;
  doc: Doc;
}) => (
  <>
    {Object.entries(content).map(([mediaType, media]) => (
      <div key={mediaType} className="mt-4">
        {media.schema && (
          <SchemaBlock name="response" root={media.schema} bundled={doc.bundled} readOnly />
        )}
      </div>
    ))}
  </>
);

export const Responses = ({
  responses: raw,
  doc,
}: {
  responses?: OperationObject["responses"];
  doc: Doc;
}) => {
  const responses = Object.entries(raw ?? {}).map(([status, item]) => {
    const response = doc.resolve(item);
    const content: Record<string, any> = {};
    for (const [mediaType, media] of Object.entries(response.content ?? {}))
      content[mediaType] = doc.resolve(media);
    return { status, content };
  });
  if (responses.length === 0) return null;

  return (
    <section className="mt-10 not-prose">
      <h3 id="response-body" className="scroll-m-24 text-xl font-semibold">
        {responses.length === 1 ? "Response" : "Responses"}
      </h3>
      <div className="space-y-4">
        {responses.length === 1 ? (
          <div className="py-3 text-sm">
            <div className="flex items-center gap-2 font-mono font-semibold">
              {responses[0].status}
              {Object.keys(responses[0].content).length > 0 && (
                <code className="text-xs font-normal text-fd-muted-foreground">
                  {Object.keys(responses[0].content).join(", ")}
                </code>
              )}
            </div>
            <ResponseBodyContent content={responses[0].content} doc={doc} />
          </div>
        ) : (
          responses.map((r) => (
            <details key={r.status} className="group py-3 text-sm">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-mono font-semibold">
                <ChevronRight className="size-4 shrink-0 text-fd-muted-foreground transition-transform group-open:rotate-90" />
                {r.status}
                {Object.keys(r.content).length > 0 && (
                  <code className="text-xs font-normal text-fd-muted-foreground">
                    {Object.keys(r.content).join(", ")}
                  </code>
                )}
              </summary>
              <ResponseBodyContent content={r.content} doc={doc} />
            </details>
          ))
        )}
      </div>
    </section>
  );
};

const isUsableSample = (
  sample: InlineCodeUsageGenerator,
): sample is InlineCodeUsageGenerator & { source: string } => typeof sample.source === "string";

export const buildCurlFallback = (
  method: HttpMethods,
  path: string,
  parameters: ParameterObject[],
  baseUrl: string,
): InlineCodeUsageGenerator => {
  const resolvedPath = path.replace(/\{([^}]+)\}/g, (_, name: string) => `<${name}>`);
  const query = parameters
    .filter((p) => p.in === "query")
    .map((p) => `${p.name}=<${p.name}>`)
    .join("&");
  const url = `${baseUrl}${resolvedPath}${query ? `?${query}` : ""}`;
  const headers = parameters
    .filter((p) => p.in === "header")
    .map((p) => ` \\\n  -H "${p.name}: <${p.name}>"`)
    .join("");
  return {
    lang: "bash",
    label: "cURL",
    source: `curl -X ${method.toUpperCase()} "${url}"${headers}`,
  };
};

export const CodeSamples = ({
  title,
  samples,
  fallbacks,
}: {
  title: string;
  samples: InlineCodeUsageGenerator[];
  fallbacks: InlineCodeUsageGenerator[];
}) => {
  const usable = samples.filter(isUsableSample);
  const all = usable.length > 0 ? usable : fallbacks;
  const [selectedId, setSelectedId] = useState(all[0]?.id ?? all[0]?.lang);
  const current = (all.find((s) => (s.id ?? s.lang) === selectedId) ??
    all[0]) as InlineCodeUsageGenerator & { source: string };

  return (
    <div className="not-prose overflow-hidden rounded-xl border bg-fd-card">
      <div className="flex flex-row items-center gap-2 border-b p-1.5 ps-3">
        <p className="min-w-0 flex-1 text-xs font-medium whitespace-nowrap">{title}</p>
        <div className="flex flex-row items-center gap-3">
          {all.length > 1 && (
            <Select value={selectedId}>
              <SelectTrigger className="bg-fd-background px-2 py-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {all.map((item) => {
                  const value = item.id ?? item.lang;
                  return (
                    <SelectItem
                      key={value}
                      value={value}
                      onClick={() => setSelectedId(value)}
                      className={cn(
                        "rounded-md px-2 py-1 text-xs",
                        value === selectedId
                          ? "bg-fd-secondary text-fd-secondary-foreground"
                          : "text-fd-muted-foreground hover:text-fd-foreground",
                      )}
                    >
                      {item.label ?? item.lang}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          {current.source && <CopyButton code={current.source} />}
        </div>
      </div>
      <ClientCodeBlock lang={current.lang} code={current.source} />
    </div>
  );
};

interface ResponseExampleEntry {
  label: string;
  sample: unknown;
  description?: string;
}

interface ResponseTab {
  code: string;
  mediaType: string;
  examples: ResponseExampleEntry[];
}

const langOf = (mediaType: string): string => {
  if (mediaType.includes("json")) return "json";
  if (mediaType.includes("xml")) return "xml";
  if (mediaType.includes("yaml")) return "yaml";
  return "text";
};

export const buildResponseTabs = (
  responses: OperationObject["responses"],
  doc: Doc,
): ResponseTab[] => {
  const tabs: ResponseTab[] = [];

  for (const [status, raw] of Object.entries(responses ?? {})) {
    const response = doc.resolve(raw);
    const [mediaType, rawMedia] = Object.entries(response.content ?? {})[0] ?? [];
    if (!mediaType || !rawMedia) continue;
    const media = doc.resolve(rawMedia);

    const examples: ResponseExampleEntry[] = [];
    const namedExamples = Object.entries(media.examples ?? {});

    if (namedExamples.length > 0) {
      for (const [name, rawExample] of namedExamples) {
        const example = doc.resolve(rawExample);
        examples.push({
          label: example.summary ?? name,
          sample: example.value,
          description: example.description,
        });
      }
    } else if (media.example !== undefined) {
      examples.push({ label: "Example", sample: media.example });
    } else if (media.schema) {
      examples.push({ label: "Example", sample: synthesizeExample(media.schema, doc) });
    }

    tabs.push({ code: status, mediaType, examples });
  }

  return tabs;
};

export const ResponseExamples = ({ tabs }: { tabs: ResponseTab[] }) => {
  const [activeCode, setActiveCode] = useState(tabs[0]?.code);
  const [exampleIndex, setExampleIndex] = useState(0);

  const tab = tabs.find((item) => item.code === activeCode) ?? tabs[0];
  const examples = tab?.examples ?? [];
  const index = Math.max(Math.min(exampleIndex, examples.length - 1), 0);
  const example = examples[index];
  const code = example ? JSON.stringify(example.sample, null, 2) : undefined;

  if (!tab) return null;

  return (
    <div className="not-prose mt-2 overflow-hidden rounded-xl border bg-fd-card">
      <div className="flex flex-row items-center gap-1 border-b p-1.5">
        {tabs.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => {
              setActiveCode(item.code);
              setExampleIndex(0);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs transition-colors",
              item.code === tab.code
                ? "bg-fd-secondary text-fd-secondary-foreground"
                : "text-fd-muted-foreground hover:text-fd-accent-foreground",
            )}
          >
            {item.code}
          </button>
        ))}
        <div className="ms-auto flex flex-row items-center gap-1">
          {examples.length > 1 && (
            <Select
              value={index.toString()}
              onValueChange={(value) => setExampleIndex(Number(value))}
            >
              <SelectTrigger className="w-auto gap-1.5 border-none bg-transparent py-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {examples.map((item, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {code && <CopyButton code={code} />}
        </div>
      </div>
      {example?.description && (
        <div className="border-b px-3 py-2 text-sm">
          <Markdown>{example.description}</Markdown>
        </div>
      )}
      {code ? (
        <ClientCodeBlock
          lang={langOf(tab.mediaType)}
          code={code}
          className="max-h-200 overflow-scroll scrollbar-none"
        />
      ) : (
        <p className="px-3 py-2.5 text-xs text-fd-muted-foreground">No example available</p>
      )}
    </div>
  );
};
