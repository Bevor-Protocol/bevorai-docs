import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fumadocs/api-docs/components/select";
import type {
  HttpMethods,
  MediaTypeObject,
  OperationObject,
  ParameterObject,
} from "fumadocs-openapi";
import type { InlineCodeUsageGenerator } from "fumadocs-openapi/requests/generators";
import { useState } from "react";
import { Markdown } from "@/components/ui/markdown";
import type { Doc } from "@/hooks/use-doc";
import { cn } from "@/lib/cn";
import { ClientCodeBlock } from "../code";
import { CopyButton } from "../copy-button";
import { buildGeneratedSamples, buildRequestData, synthesizeExample } from "../registry";
import type { ParsedSchema } from "../schema";

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
  doc,
  method,
  path,
  operation,
  parameters,
}: {
  title: string;
  method: HttpMethods;
  path: string;
  operation: OperationObject;
  parameters: ParameterObject[];
  doc: Doc;
}) => {
  const baseUrl = doc.dereferenced.servers?.[0]?.url ?? "";
  const codeSamples = operation["x-codeSamples"] ?? [];
  const fallbacks =
    codeSamples.length > 0
      ? []
      : buildGeneratedSamples(
          buildRequestData(method, path, parameters, operation.requestBody, doc, baseUrl),
        );
  const samples = operation["x-codeSamples"] ?? [];

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

type MediaSchema = NonNullable<MediaTypeObject["schema"]>; // ReferenceObject | SchemaObject, without naming SchemaObject
type MediaSchemaWithNdjson = MediaSchema & { "x-ndjson-item-schema"?: ParsedSchema };

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
    const schema = media.schema as MediaSchemaWithNdjson | undefined;
    const itemSchema = schema && !("$ref" in schema) ? schema["x-ndjson-item-schema"] : undefined;

    const examples: ResponseExampleEntry[] = [];
    if (itemSchema) {
      examples.push({ label: "Example", sample: [synthesizeExample(itemSchema, doc)] });
    } else {
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
    }

    tabs.push({ code: status, mediaType, examples });
  }
  return tabs;
};

export const ResponseExamples = ({ operation, doc }: { operation: OperationObject; doc: Doc }) => {
  const tabs = buildResponseTabs(operation.responses, doc);

  const [activeCode, setActiveCode] = useState(tabs[0]?.code);
  const [exampleIndex, setExampleIndex] = useState(0);

  const tab = tabs.find((item) => item.code === activeCode) ?? tabs[0];
  const examples = tab?.examples ?? [];
  const index = Math.max(Math.min(exampleIndex, examples.length - 1), 0);
  const example = examples[index];
  const isNdjson = tab?.mediaType.includes("ndjson");
  const code = example
    ? isNdjson && Array.isArray(example.sample)
      ? example.sample.map((item) => JSON.stringify(item, null, 2)).join("\n")
      : JSON.stringify(example.sample, null, 2)
    : undefined;

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
