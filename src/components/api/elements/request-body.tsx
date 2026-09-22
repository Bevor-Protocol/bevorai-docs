import type { OperationObject } from "fumadocs-openapi";
import { Markdown } from "@/components/ui/markdown";
import type { Doc } from "@/hooks/use-doc";
import { SchemaBlock } from "../schema/client";

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
      <div className="flex items-center gap-2 border-b">
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
