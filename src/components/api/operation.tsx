import { type ParameterObject } from "fumadocs-openapi";
import { type PageOperationProps } from "fumadocs-openapi/operation";
import { Badge, getMethodColor } from "@/components/api/playground/method-label";
import { useDoc } from "@/hooks/use-doc";
import { Markdown } from "../ui/markdown";
import {
  buildResponseTabs,
  CodeSamples,
  Parameters,
  RequestBody,
  ResponseExamples,
  Responses,
  Security,
} from "./elements";
import { buildGeneratedSamples, buildRequestData } from "./registry";

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
  const baseUrl = doc.dereferenced.servers?.[0]?.url ?? "";
  const codeSamples = operation["x-codeSamples"] ?? [];
  const fallbackSamples =
    codeSamples.length > 0
      ? []
      : buildGeneratedSamples(
          buildRequestData(method, path, parameters, operation.requestBody, doc, baseUrl),
        );
  const responseTabs = buildResponseTabs(operation.responses, doc);

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
          <code className="min-w-0 overflow-x-auto text-sm text-fd-muted-foreground">
            <HighlightedPath path={path} parameters={parameters} />
          </code>
        </div>
        {showDescription && operation.description && (
          <div className="mb-8">
            <Markdown>{operation.description}</Markdown>
          </div>
        )}

        <Security security={operation.security} doc={doc} />
        <Parameters parameters={parameters} method={method} />
        <RequestBody requestBody={operation.requestBody} doc={doc} />
        <Responses responses={operation.responses} doc={doc} />
      </article>
      <aside className="min-w-0 @max-4xl:mt-8">
        <div className="space-y-4 @4xl:sticky @4xl:top-(--fd-docs-row-2) @4xl:py-6">
          <CodeSamples title={title} samples={codeSamples} fallbacks={fallbackSamples} />
          {responseTabs.length > 0 && <ResponseExamples tabs={responseTabs} />}
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
