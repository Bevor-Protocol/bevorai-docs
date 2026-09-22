import type { HttpMethods } from "fumadocs-openapi";
import type { OpenAPIPageProps_Spec } from "fumadocs-openapi/ui";
import { DocContext, useDereferencedDocument } from "@/hooks/use-doc";
import { Footer } from "@/layouts/docs/page/slots/footer";
import { Operation } from "./api/operation";

export const OpenAPIPage = ({
  payload,
  operations,
  webhooks,
  showTitle = true,
  showDescription = true,
}: OpenAPIPageProps_Spec) => {
  const doc = useDereferencedDocument(payload.bundled);

  const items: { type: "operation" | "webhook"; path: string; method: HttpMethods }[] = [
    ...(operations ?? []).map((op) => ({
      type: "operation" as const,
      path: op.path,
      method: op.method,
    })),
    ...(webhooks ?? []).map((wh) => ({
      type: "webhook" as const,
      path: `/${wh.name}`,
      method: wh.method,
    })),
  ];

  const item = items[0];
  if (!item) throw new Error("[openapi] page has no operation or webhook");

  const pathItem = doc.resolve(doc.dereferenced.paths?.[item.path]);
  if (!pathItem) throw new Error(`[openapi] path not found: ${item.path}`);
  const operation = pathItem[item.method];
  if (!operation) throw new Error(`[openapi] method ${item.method} not found on ${item.path}`);

  return (
    <DocContext value={doc}>
      <div className="@container">
        <div className="grid gap-x-8 @4xl:grid-cols-[minmax(0,1fr)_minmax(320px,500px)]">
          {/*{operations?.map((op) => (
            <Operation
              key={`${op.path}:${op.method}`}
              type={item.type}
              operation={op}
              pathItem={pathItem}
              path={op.path}
              method={op.method}
              showTitle={showTitle}
              showDescription={showDescription}
            />
          ))}
          {webhooks?.map(({ item, children }) => (
            <Fragment key={`${item.name}:${item.method}`}>{children}</Fragment>
          ))}*/}
          <Operation
            type={item.type}
            operation={operation}
            pathItem={pathItem}
            path={item.path}
            method={item.method}
            showTitle={showTitle}
            showDescription={showDescription}
          />
          <Footer className="mt-12 border-t pt-6 @4xl:col-start-1" />
        </div>
      </div>
    </DocContext>
  );
};
