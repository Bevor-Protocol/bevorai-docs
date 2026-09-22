import type { HttpMethods, ParameterObject } from "fumadocs-openapi";
import { Fragment } from "react/jsx-runtime";
import type { Doc } from "@/hooks/use-doc";
import { SchemaBlock } from "../schema/client";

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
          <h3 id={`parameters-${location}`} className="scroll-m-24 text-xl font-semibold border-b">
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
