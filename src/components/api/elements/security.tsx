import type { OperationObject } from "fumadocs-openapi";
import { Markdown } from "@/components/ui/markdown";
import type { Doc } from "@/hooks/use-doc";

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
      <h3 id="authorization" className="scroll-m-24 text-xl font-semibold border-b">
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
