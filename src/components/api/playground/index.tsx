import { useTranslations } from "@fuma-translate/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@fumadocs/api-docs/components/collapsible";
import { labelVariants } from "@fumadocs/api-docs/components/input";
import {
  FieldInput,
  FieldSet,
  JsonInput,
  ObjectInput,
} from "@fumadocs/api-docs/components/playground/inputs";
import {
  anyFields,
  SchemaProvider,
  useResolvedSchema,
} from "@fumadocs/api-docs/components/playground/schema";
import {
  type DataEngine,
  type FieldKey,
  useDataEngine,
  useFieldValue,
  useListener,
} from "@fumari/stf";
import { arrayStartsWith, objectGet, objectSet, stringifyFieldKey } from "@fumari/stf/lib/utils";
import { useOnChange } from "fumadocs-core/utils/use-on-change";
import type {
  HttpMethods,
  OperationObject,
  ParameterObject,
  PathItemObject,
} from "fumadocs-openapi";
import { useOpenAPI } from "fumadocs-openapi";
import { ChevronDown } from "lucide-react";
import { type ComponentProps, type FC, Fragment, type ReactNode, useMemo, useState } from "react";
import { cn } from "../../../lib/cn";
import { buttonVariants } from "../../ui/button";
import { useAuth } from "./auth";
import type { BrowserFetcherOptions } from "./fetcher";
import { Badge, getMethodColor } from "./method-label";
import { OAuthDialog, OAuthDialogContent, OAuthDialogTrigger } from "./oauth-dialog";
import { DefaultResultDisplay, type ResultDisplayProps } from "./result-display";
import { type ParsedSchema } from "./schema";
import ServerSelect from "./server-select";
import { useStorageKey } from "./storage-key";

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

interface SecurityEntry {
  scopes: string[];
  id: string;
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

function ParameterItem({ type, parameters }: { type: ParamType; parameters: ParameterObject[] }) {
  const { renderParameterField } = useRenderContext().playground ?? {};

  return parameters.map((field) => {
    const fieldName: FieldKey = [type, field.name!];
    if (renderParameterField) {
      return renderParameterField(fieldName, field);
    }

    const contentTypes = field.content && Object.keys(field.content);
    const schema =
      field.content && contentTypes && contentTypes.length > 0
        ? field.content[contentTypes[0]].schema
        : field.schema;

    return (
      <FieldSet
        key={stringifyFieldKey(fieldName)}
        name={field.name}
        fieldName={fieldName}
        field={(schema ?? anyFields) as ParsedSchema}
        isRequired={field.required}
      />
    );
  });
}

function ParametersForm({ parameters }: { parameters: ParameterObject[] }) {
  const { components: { CollapsiblePanel = DefaultCollapsiblePanel } = {} } =
    useRenderContext().playground ?? {};
  const t = useTranslations({ note: "playground" });
  const displayNames = {
    header: t("Header"),
    cookie: t("Cookies"),
    query: t("Query"),
    path: t("Path"),
  };

  return ParamTypes.map((type) => {
    const items = parameters.filter((v) => v.in === type);
    if (items.length === 0) return;

    return (
      <CollapsiblePanel key={type} data-type={type} title={displayNames[type]}>
        <ParameterItem parameters={items} type={type} />
      </CollapsiblePanel>
    );
  });
}

function BodyInput({ field: _field }: { field: ParsedSchema }) {
  const field = useResolvedSchema(_field);
  const [isJson, setIsJson] = useState(false);
  const t = useTranslations({ note: "playground" });

  if (field.format === "binary") return <FieldSet field={field} fieldName={["body"]} isRequired />;

  if (isJson)
    return (
      <>
        <button
          className={cn(
            buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "w-fit font-mono p-2",
            }),
          )}
          onClick={() => setIsJson(false)}
          type="button"
        >
          {t("Close JSON Editor")}
        </button>
        <JsonInput fieldName={["body"]} />
      </>
    );

  return (
    <FieldSet
      field={field}
      fieldName={["body"]}
      collapsible={false}
      isRequired
      name={
        <button
          type="button"
          className={cn(
            buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "p-2",
            }),
          )}
          onClick={() => setIsJson(true)}
        >
          {t("Open JSON Editor")}
        </button>
      }
    />
  );
}

export interface AuthField {
  fieldName: FieldKey;
  schemeId: string;
  storageKey: string;
  defaultValue: unknown;
  children: ReactNode;

  mapOutput?: (values: unknown) => unknown;
}

function useAuthInputs(engine: DataEngine, requirements: SecurityEntry[][]) {
  const authCtx = useAuth();
  const storageKeys = useStorageKey();
  const t = useTranslations({ note: "playground" });
  const ctx = useRenderContext();
  const { resolve } = ctx.schema;
  const schemes = ctx.schema.dereferenced.components?.securitySchemes;
  const { transformAuthInputs } = ctx.playground ?? {};

  const [requirementId, setRequirementId] = useState(() => {
    if (!schemes || requirements.length === 0) return -1;

    const idx = requirements.findIndex((s) =>
      s.every((item) => !resolve(schemes[item.id]).deprecated),
    );
    return idx !== -1 ? idx : 0;
  });
  const requirement = requirementId === -1 ? null : requirements[requirementId];

  let inputs = useMemo<AuthField[]>(() => {
    if (!requirement || !schemes) return [];

    return requirement.map((item) => {
      const scheme = resolve(schemes?.[item.id]);
      if (scheme.type === "http" && scheme.scheme === "basic") {
        const fieldName: FieldKey = ["header", "Authorization"];
        return {
          fieldName,
          schemeId: item.id,
          storageKey: storageKeys.AuthField(item.id),
          defaultValue: {
            username: "",
            password: "",
          },
          mapOutput(out: unknown) {
            if (out && typeof out === "object") {
              const obj = out as Record<string, unknown>;
              return `Basic ${btoa(`${obj.username ?? ""}:${obj.password ?? ""}`)}`;
            }
            return out;
          },
          children: (
            <ObjectInput
              field={{
                type: "object",
                properties: {
                  username: {
                    type: "string",
                  },
                  password: {
                    type: "string",
                  },
                },
              }}
              fieldName={fieldName}
            />
          ),
        };
      }
      if (scheme.type === "oauth2") {
        const fieldName: FieldKey = ["header", "Authorization"];
        return {
          fieldName,
          schemeId: item.id,
          storageKey: storageKeys.AuthField(item.id),
          defaultValue: "Bearer ",
          children: <OAuth2Input fieldName={fieldName} security={item} />,
        };
      }
      if (scheme.type === "http") {
        const fieldName: FieldKey = ["header", "Authorization"];
        return {
          fieldName,
          schemeId: item.id,
          storageKey: storageKeys.AuthField(item.id),
          defaultValue: "Bearer ",
          children: (
            <FieldSet
              name={`${t("Authorization")} (${t("Header")})`}
              fieldName={fieldName}
              field={{
                type: "string",
              }}
            />
          ),
        };
      }
      if (scheme.type === "apiKey") {
        const fieldName: FieldKey = [scheme.in!, scheme.name!];
        return {
          fieldName,
          schemeId: item.id,
          defaultValue: "",
          storageKey: storageKeys.AuthField(item.id),
          children: (
            <FieldSet
              fieldName={fieldName}
              name={`${scheme.name} (${scheme.in})`}
              field={{
                type: "string",
              }}
            />
          ),
        };
      }
      // fallback: openid or unknown
      const fieldName: FieldKey = ["header", "Authorization"];
      return {
        fieldName,
        schemeId: item.id,
        defaultValue: "",
        storageKey: storageKeys.AuthField(item.id),
        children: (
          <>
            <FieldSet
              name={`${t("Authorization")} (${t("Header")})`}
              fieldName={fieldName}
              field={{
                type: "string",
              }}
            />
            <p className="text-fd-muted-foreground text-xs">
              {t(
                "OpenID Connect is not supported at the moment, you can still set an access token here.",
              )}
            </p>
          </>
        ),
      };
    });
  }, [requirement, storageKeys, schemes, resolve, t]);
  if (transformAuthInputs) inputs = transformAuthInputs(inputs);

  useListener({
    stf: engine,
    onUpdate(key) {
      for (const item of inputs) {
        if (!arrayStartsWith(item.fieldName, key)) continue;
        const value = engine.get(item.fieldName);

        if (value != null) {
          localStorage.setItem(item.storageKey, JSON.stringify(value));
        }
      }
    },
  });

  useOnChange(authCtx.updatedSchemeId, () => {
    const { updatedSchemeId } = authCtx;
    if (!updatedSchemeId) return;
    const { token } = authCtx.store[updatedSchemeId]!;

    const input = inputs.find((input) => input.schemeId === updatedSchemeId);
    if (input) {
      // update current value
      engine.update(input.fieldName, token);
      return;
    }

    const idx = requirements.findIndex((requirement) =>
      requirement.some((item) => item.id === updatedSchemeId),
    );
    if (idx !== -1) {
      // persisted value
      localStorage.setItem(storageKeys.AuthField(updatedSchemeId), JSON.stringify(token));
      setRequirementId(idx);
    }
  });

  return {
    inputs,
    requirementId,
    setRequirementId,
    mapInputs(values: FormValues) {
      const cloned = structuredClone(values);

      for (const item of inputs) {
        if (!item.mapOutput) continue;
        objectSet(cloned, item.fieldName, item.mapOutput(objectGet(cloned, item.fieldName)));
      }

      return cloned;
    },
    initAuthInputs() {
      for (const item of inputs) {
        const stored = localStorage.getItem(item.storageKey);

        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed === typeof item.defaultValue) {
            engine.init(item.fieldName, parsed);
            continue;
          }
        }

        engine.init(item.fieldName, item.defaultValue);
      }

      // reset
      return () => {
        for (const item of inputs) {
          engine.delete(item.fieldName);
        }
      };
    },
  };
}

function OAuth2Input({ fieldName, security }: { fieldName: FieldKey; security: SecurityEntry }) {
  const [open, setOpen] = useState(false);
  const engine = useDataEngine();
  const t = useTranslations({ note: "playground" });

  return (
    <fieldset className="flex flex-col gap-2">
      <label htmlFor={stringifyFieldKey(fieldName)} className={cn(labelVariants())}>
        {t("Access Token")}
      </label>
      <div className="flex gap-2">
        <FieldInput
          fieldName={fieldName}
          field={{
            type: "string",
          }}
          className="flex-1"
        />

        <OAuthDialog open={open} onOpenChange={setOpen}>
          <OAuthDialogTrigger
            type="button"
            className={cn(
              buttonVariants({
                size: "sm",
                variant: "secondary",
              }),
            )}
          >
            {t("Authorize")}
          </OAuthDialogTrigger>
          <OAuthDialogContent
            setOpen={setOpen}
            schemeId={security.id}
            scopes={security.scopes}
            setToken={(token) => engine.update(["header", "Authorization"], token)}
          />
        </OAuthDialog>
      </div>
    </fieldset>
  );
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
