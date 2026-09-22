import type { ParsedSchema } from "@fumadocs/api-docs/schema";
import type { OperationObject } from "fumadocs-openapi";
import { ChevronRight } from "lucide-react";
import type { Doc } from "@/hooks/use-doc";
import { SchemaBlock } from "../schema/client";

const responseSchemaName = (schema: ParsedSchema, bundled: object): string => {
  if (typeof schema !== "object" || schema === null) return "response";
  if (typeof schema.$ref === "string") {
    const key = schema.$ref.split("/").pop();
    const target = key ? (bundled as any)?.components?.schemas?.[key] : undefined;
    return typeof target?.title === "string" ? target.title : (key ?? "response");
  }
  return typeof schema.title === "string" ? schema.title : "response";
};

export const ResponseBodyContent = ({
  content,
  doc,
}: {
  content: Record<string, any>;
  doc: Doc;
}) => (
  <>
    {Object.entries(content).map(([mediaType, media]) => {
      const itemSchema = media.schema?.["x-ndjson-item-schema"];
      const root = itemSchema ?? media.schema;
      if (!root) return null;
      return (
        <div key={mediaType} className="mt-4">
          <SchemaBlock
            name={responseSchemaName(root, doc.bundled)}
            root={root}
            bundled={doc.bundled}
            readOnly
          />
          {itemSchema && (
            <p className="mt-2 text-xs text-fd-muted-foreground">
              Streamed as newline-delimited JSON ({mediaType}) — one object per line, repeated for
              the duration of the stream.
            </p>
          )}
        </div>
      );
    })}
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
      <h3 id="response-body" className="scroll-m-24 text-xl font-semibold border-b">
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
