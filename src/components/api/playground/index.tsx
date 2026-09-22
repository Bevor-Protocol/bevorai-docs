import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@fumadocs/api-docs/components/collapsible";
import { SchemaProvider } from "@fumadocs/api-docs/components/playground/schema";
import { type FieldKey, useFieldValue } from "@fumari/stf";
import type {
  HttpMethods,
  OperationObject,
  ParameterObject,
  PathItemObject,
} from "fumadocs-openapi";
import { useOpenAPI } from "fumadocs-openapi";
import { ChevronDown } from "lucide-react";
import { type ComponentProps, type FC, Fragment, type ReactNode } from "react";
import { cn } from "../../../lib/cn";
import type { BrowserFetcherOptions } from "./fetcher";
import { Badge, getMethodColor } from "./method-label";
import { DefaultResultDisplay, type ResultDisplayProps } from "./result-display";
import { type ParsedSchema } from "./schema";
import ServerSelect from "./server-select";

export interface FormValues extends Record<string, unknown> {
  path: Record<string, unknown>;
  query: Record<string, unknown>;
  header: Record<string, unknown>;
  cookie: Record<string, unknown>;
  body: unknown;
}

export interface PlaygroundClientProps extends Omit<ComponentProps<"div">, "method"> {
  route: string;
  method: HttpMethods;
  operation: OperationObject;
  pathItem: PathItemObject;
  writeOnly: boolean;
  readOnly: boolean;
}

export type { ResultDisplayProps };
export { DefaultResultDisplay };

export interface CollapsiblePanelProps extends Omit<ComponentProps<typeof Collapsible>, "title"> {
  "data-type": "authorization" | "body" | ParamType;
  title: ReactNode;
}

export interface PlaygroundClientOptions {
  /**
   * transform fields for auth-specific parameters (e.g. header)
   */
  transformAuthInputs?: (fields: AuthField[]) => AuthField[];

  fetchOptions?: BrowserFetcherOptions;

  components?: {
    ResultDisplay?: FC<ResultDisplayProps>;
    CollapsiblePanel?: FC<CollapsiblePanelProps>;
  };

  /**
   * render the parameter inputs of API endpoint.
   *
   * for updating values, use:
   * - the `Custom.useController()` from `fumadocs-openapi/playground/client`.
   *
   * Recommended types packages: `json-schema-typed`.
   */
  renderParameterField?: (fieldName: FieldKey, param: ParameterObject) => ReactNode;

  /**
   * render the input for API endpoint body.
   *
   * @see renderParameterField for customization tips
   */
  renderBodyField?: (fieldName: "body", info: RequestBodyInfo) => ReactNode;
}

const useRenderContext = () => ({
  schema: useOpenAPI().doc,
  playground: undefined as PlaygroundClientOptions | undefined,
});

interface RequestBodyInfo {
  schema: ParsedSchema;
  mediaType: string;
}

export default function PlaygroundClient({
  route,
  method,
  operation,
  pathItem,
  writeOnly,
  readOnly,
  ...rest
}: PlaygroundClientProps) {
  const ctx = useRenderContext();
  const { dereferenced } = ctx.schema;

  return (
    <SchemaProvider docRoot={dereferenced as never} writeOnly={writeOnly} readOnly={readOnly}>
      <div {...rest} className={cn("not-prose flex overflow-hidden", rest.className)}>
        <ServerSelect className="border-b" />
        <div className="flex flex-row items-center gap-2 text-sm py-3 not-last:pb-0">
          <Badge color={getMethodColor(method)}>{method.toUpperCase()}</Badge>
          <Route route={route} className={cn("flex-1", operation.deprecated && "line-through")} />
        </div>
      </div>
    </SchemaProvider>
  );
}

const ParamTypes = ["path", "header", "cookie", "query"] as const;
type ParamType = (typeof ParamTypes)[number];

export interface AuthField {
  fieldName: FieldKey;
  schemeId: string;
  storageKey: string;
  defaultValue: unknown;
  children: ReactNode;

  mapOutput?: (values: unknown) => unknown;
}

function Route({ route, ...props }: ComponentProps<"div"> & { route: string }) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-row items-center gap-0.5 overflow-auto text-nowrap",
        props.className,
      )}
    >
      {route.split("/").map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <span className="text-fd-muted-foreground">/</span>}
          {part.startsWith("{") && part.endsWith("}") ? (
            <code className="bg-fd-primary/10 text-fd-primary">{part}</code>
          ) : (
            <code className="text-fd-foreground">{part}</code>
          )}
        </Fragment>
      ))}
    </div>
  );
}

export function DefaultCollapsiblePanel({ title, children, ...props }: CollapsiblePanelProps) {
  return (
    <Collapsible {...props} className={cn("border-b last:border-b-0", props.className)}>
      <CollapsibleTrigger className="group w-full flex items-center gap-2 p-3 text-sm font-medium">
        {title}
        <ChevronDown className="ms-auto size-3.5 text-fd-muted-foreground group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 p-3 pt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const Custom = {
  useController(
    fieldName: FieldKey,
    options?: {
      defaultValue?: unknown;
    },
  ) {
    const [value, setValue] = useFieldValue(fieldName, options);
    return {
      value,
      setValue,
    };
  },
};
