import { type ParameterObject } from "fumadocs-openapi";
import { type PageOperationProps } from "fumadocs-openapi/operation";
import { Badge, getMethodColor } from "@/components/ui/badge";
import { useDoc } from "@/hooks/use-doc";
import { Markdown } from "../ui/markdown";
import { CodeSamples, ResponseExamples } from "./elements/examples";
import { Parameters } from "./elements/parameters";
import { RequestBody } from "./elements/request-body";
import { Responses } from "./elements/response-body";
import { Security } from "./elements/security";

export const Operation: React.FC<PageOperationProps> = ({
  operation,
  pathItem,
  path,
  method,
  showTitle,
  showDescription,
}) => {
  const doc = useDoc();
  const parameters = (operation.parameters ?? []).map((p) => doc.resolve(p));
  const title =
    operation.summary ||
    pathItem.summary ||
    (operation.operationId ? idToTitle(operation.operationId) : path);

  return (
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
          <code className="min-w-0 overflow-x-auto text-sm">
            <HighlightedPath path={path} parameters={parameters} />
          </code>
        </div>
        {showDescription && operation.description && (
          <div className="mb-8 text-base text-fd-muted-foreground">
            <Markdown>{operation.description}</Markdown>
          </div>
        )}

        <Security security={operation.security} doc={doc} />
        <Parameters parameters={parameters} method={method} doc={doc} />
        <RequestBody requestBody={operation.requestBody} doc={doc} />
        <Responses responses={operation.responses} doc={doc} />
      </article>
      <aside className="min-w-0 @max-4xl:mt-8">
        <div className="space-y-4 @4xl:sticky @4xl:top-(--fd-docs-row-2) @4xl:py-6">
          <CodeSamples
            title={title}
            method={method}
            path={path}
            operation={operation}
            parameters={parameters}
            doc={doc}
          />
          <ResponseExamples operation={operation} doc={doc} />
        </div>
      </aside>
    </>
  );
};

const idToTitle = (id: string) =>
  id.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

const HighlightedPath = ({ path, parameters }: { path: string; parameters: ParameterObject[] }) => {
  const pathParamNames = new Set(parameters.filter((p) => p.in === "path").map((p) => p.name));

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
};
