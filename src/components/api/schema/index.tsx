import { fromTranslations, useTranslations } from "@fuma-translate/react";
import type { ParsedSchema } from "@fumadocs/api-docs/schema";
import { dereferenceShallow } from "@fumadocs/api-docs/schema/dereference";
import { mergeAllOf } from "@fumadocs/api-docs/schema/merge";
import { FormatFlags, schemaToString } from "@fumadocs/api-docs/schema/to-string";
import { Fragment, type ReactNode, useMemo } from "react";
import { BlockTag, InlineTag, SchemaUI, type SchemaUIProps } from "./client";

interface InfoTag {
  node: ReactNode;
  block?: boolean;
}

interface DiscriminatorObject {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface FieldBase {
  description?: ReactNode;
  infoTags?: InfoTag[];

  typeName: string;
  aliasName: string;

  deprecated?: boolean;
}

export interface SchemaDataObjectProperty {
  name: string;
  $type: string;
  required: boolean;
}

export type SchemaData = FieldBase &
  (
    | {
        type: "primitive";
      }
    | {
        type: "object";
        props: SchemaDataObjectProperty[];
      }
    | {
        type: "array";
        item: {
          $type: string;
        };
      }
    | {
        type: "or";
        items: {
          name: string;
          $type: string;
          itemId?: string;
        }[];
        discriminator?: DiscriminatorObject;
      }
    | {
        type: "and";
        items: {
          name: string;
          $type: string;
          itemId?: string;
        }[];
        discriminator?: DiscriminatorObject;
      }
  );

export interface SchemaUIOptions {
  root: ParsedSchema;
  client: Omit<SchemaUIProps, "generated">;
  renderMarkdown: (md: string) => ReactNode;
  renderCodeblock: (opts: { lang: string; code: string }) => ReactNode;

  /**
   * include read only props
   */
  readOnly?: boolean;
  /**
   * include write only props
   */
  writeOnly?: boolean;

  /**
   * Show example values as tags
   *
   * @default false
   */
  showExample?: boolean;
}

export interface SchemaUIGeneratedData {
  $root: string;
  refs: Record<string, SchemaData>;
}

export function Schema({
  client,
  root,
  readOnly,
  writeOnly,
  showExample,
  renderMarkdown,
  renderCodeblock,
}: SchemaUIOptions) {
  const translations = useTranslations().translations;
  const generated = useMemo(() => {
    return generateSchemaUI({
      root,
      readOnly,
      writeOnly,
      showExample,
      renderMarkdown,
      renderCodeblock,
      translations,
    });
  }, [root, readOnly, writeOnly, showExample, renderMarkdown, renderCodeblock, translations]);

  return <SchemaUI {...client} generated={generated} />;
}

export function generateSchemaUI({
  root,
  renderMarkdown,
  renderCodeblock,
  readOnly = false,
  writeOnly = false,
  showExample = false,
  translations = {},
}: Omit<SchemaUIOptions, "client"> & {
  translations?: Partial<Record<string, string>>;
}): SchemaUIGeneratedData {
  const t = fromTranslations(translations, { note: "schema UI" });
  const refs: Record<string, SchemaData> = {};

  function generateInfoTags(schema: Exclude<ParsedSchema, boolean>) {
    const inlines: InfoTag[] = [];
    const blocks: InfoTag[] = [];

    if (schema.pattern) {
      inlines.push({
        node: <InlineTag label={t("Match")}>{schema.pattern}</InlineTag>,
      });
    }

    if (schema.format) {
      inlines.push({
        node: <InlineTag label={t("Format")}>{schema.format}</InlineTag>,
      });
    }

    if (schema.multipleOf) {
      inlines.push({
        node: <InlineTag label={t("Multiple Of")}>{schema.multipleOf}</InlineTag>,
      });
    }

    let range = formatRange(
      "value",
      schema.minimum,
      schema.exclusiveMinimum,
      schema.maximum,
      schema.exclusiveMaximum,
    );
    if (range) {
      inlines.push({
        node: <InlineTag label={t("Range")}>{range}</InlineTag>,
      });
    }

    range = formatRange("length", schema.minLength, undefined, schema.maxLength, undefined);
    if (range) {
      inlines.push({
        node: <InlineTag label={t("Length")}>{range}</InlineTag>,
      });
    }

    range = formatRange(
      "properties",
      schema.minProperties,
      undefined,
      schema.maxProperties,
      undefined,
    );
    if (range) {
      inlines.push({
        node: <InlineTag label={t("Properties")}>{range}</InlineTag>,
      });
    }

    range = formatRange("items", schema.minItems, undefined, schema.maxItems, undefined);
    if (range) {
      inlines.push({
        node: <InlineTag label={t("Items")}>{range}</InlineTag>,
      });
    }

    if (schema.enum && schema.enum.length > 0) {
      // string members are rendered bare; `JSON.stringify` would wrap them in quotes
      const members = schema.enum.map((value: unknown) =>
        typeof value === "string" ? value : JSON.stringify(value, null, 2),
      );

      blocks.push({
        block: true,
        node: (
          <div className="w-full flex flex-row items-start gap-3 pt-3">
            <p className="not-prose whitespace-nowrap">Value in:</p>
            <div className="flex items-center gap-2 flex-wrap">
              {members.map((m: string, i: number) => (
                <Fragment key={i}>
                  <span className="font-mono text-xs">
                    {m + (i < members.length - 1 ? "," : "")}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>
        ),
      });
    }

    if (schema.default !== undefined) {
      const defaultCode = JSON.stringify(schema.default, null, 2);
      if (defaultCode.includes("\n")) {
        blocks.push({
          block: true,
          node: (
            <div className="flex flex-col w-full gap-2 border-t pt-3 not-prose">
              <p className="font-medium text-xs text-fd-muted-foreground">{t("Default")}</p>
              {renderCodeblock({ lang: "json", code: defaultCode })}
            </div>
          ),
        });
      } else {
        inlines.push({
          node: (
            <span className="inline-flex items-center gap-1 rounded-md border bg-fd-secondary px-1.5 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
              <span className="font-medium text-fd-foreground">{t("Default")}</span>
              {defaultCode}
            </span>
          ),
        });
      }
    }

    if (showExample && schema.examples) {
      for (const example of schema.examples) {
        const code = JSON.stringify(example, null, 2);

        if (code.includes("\n")) {
          blocks.push({
            node: (
              <BlockTag label={t("Example")}>{renderCodeblock({ lang: "json", code })}</BlockTag>
            ),
          });

          continue;
        }

        inlines.push({
          node: <InlineTag label={t("Example")}>{code}</InlineTag>,
        });
      }
    }

    return [...inlines, ...blocks];
  }

  let _counter = 0;
  const autoIds = new WeakMap<Exclude<ParsedSchema, boolean>, string>();
  function getSchemaId(schema: ParsedSchema): string {
    if (typeof schema === "boolean") return String(schema);
    const rawRef = typeof schema.$ref === "string" ? schema.$ref : undefined;
    if (rawRef) return rawRef;

    const prev = autoIds.get(schema);
    if (prev) return prev;

    const generated = `__${_counter++}`;
    autoIds.set(schema, generated);
    return generated;
  }

  function isVisible(raw: ParsedSchema): boolean {
    const schema = dereferenceShallow(raw);
    if (typeof schema === "boolean") return true;
    if (schema.writeOnly) return writeOnly;
    if (schema.readOnly) return readOnly;
    return true;
  }

  function base(raw: ParsedSchema): FieldBase {
    const schema = dereferenceShallow(raw);
    if (typeof schema === "boolean") {
      const name = schema ? "any" : "never";
      return {
        typeName: name,
        aliasName: name,
      };
    }

    return {
      description: schema.description ? renderMarkdown(schema.description) : undefined,
      infoTags: generateInfoTags(schema),
      typeName: schemaToString(raw),
      aliasName: schemaToString(raw, FormatFlags.UseAlias),
      deprecated: schema.deprecated,
    };
  }

  function scanRefs(id: string, raw: ParsedSchema) {
    if (id in refs) return;
    const schema = dereferenceShallow(raw);
    if (typeof schema === "boolean") {
      refs[id] = {
        type: "primitive",
        ...base(raw),
      };
      return;
    }

    if (Array.isArray(schema.type)) {
      const out: SchemaData = {
        type: "or",
        items: [],
        ...base(raw),
      };
      refs[id] = out;

      for (const type of schema.type) {
        const key = `${id}_type:${type}`;
        scanRefs(key, {
          ...schema,
          type,
        });
        out.items.push({
          name: type,
          $type: key,
        });
      }
      return;
    }

    if (schema.oneOf && schema.anyOf) {
      const out: SchemaData = {
        type: "and",
        items: [],
        ...base(raw),
      };
      refs[id] = out;
      for (const omit of ["anyOf", "oneOf"] as const) {
        const $type = `${id}_omit:${omit}`;
        scanRefs($type, { ...schema, [omit]: undefined });

        out.items.push({
          name: refs[$type].aliasName,
          $type,
        });
      }
      return;
    }

    // display both `oneOf` & `anyOf` as OR for simplified overview
    const union = schema.oneOf ?? schema.anyOf;
    if (union) {
      const out: SchemaData = {
        type: "or",
        items: [],
        discriminator: schema.discriminator,
        ...base(raw),
      };
      refs[id] = out;

      for (const rawItem of union) {
        if (!rawItem || typeof rawItem !== "object" || !isVisible(rawItem)) continue;
        const itemId = getSchemaId(rawItem);
        const item = dereferenceShallow(rawItem);
        if (typeof item !== "object") continue;
        const key = `${id}_extends:${itemId}`;

        scanRefs(key, {
          ...schema,
          oneOf: undefined,
          anyOf: undefined,
          ...item,
          properties: {
            ...schema.properties,
            ...item.properties,
          },
        });
        out.items.push({
          $type: key,
          itemId,
          name: refs[itemId]?.aliasName ?? schemaToString(rawItem, FormatFlags.UseAlias),
        });
      }
      return;
    }

    if (schema.allOf) {
      scanRefs(id, mergeAllOf(schema));
      return;
    }

    if (schema.type === "object") {
      const out: SchemaData = {
        type: "object",
        props: [],
        ...base(raw),
      };
      refs[id] = out;

      const { properties = {}, patternProperties, additionalProperties } = schema;
      const props = Object.entries(properties);
      if (patternProperties) props.push(...Object.entries(patternProperties));

      for (const [key, prop] of props) {
        if (!prop || !isVisible(prop)) continue;
        const $type = getSchemaId(prop);
        scanRefs($type, prop);
        out.props.push({
          $type,
          name: key,
          required: schema.required?.includes(key) ?? false,
        });
      }

      if (additionalProperties && isVisible(additionalProperties)) {
        const $type = getSchemaId(additionalProperties);
        scanRefs($type, additionalProperties);

        out.props.push({
          $type,
          name: "[key: string]",
          required: false,
        });
      }
      return;
    }

    if (schema.type === "array") {
      const items = schema.items ?? true;
      const $type = getSchemaId(items);

      refs[id] = {
        type: "array",
        item: {
          $type,
        },
        ...base(raw),
      };
      scanRefs($type, items);
      return;
    }

    refs[id] = {
      type: "primitive",
      ...base(raw),
    };
  }

  const $root = getSchemaId(root);
  scanRefs($root, root);
  return {
    refs,
    $root,
  };
}

function formatRange(
  value: string,
  min: number | undefined,
  exclusiveMin: number | undefined,
  max: number | undefined,
  exclusiveMax: number | undefined,
) {
  const out: string[] = [];
  if (min !== undefined) {
    out.push(`${min} <=`);
  } else if (exclusiveMin !== undefined) {
    out.push(`${exclusiveMin} <`);
  }

  out.push(value);
  if (max !== undefined) {
    out.push(`<= ${max}`);
  } else if (exclusiveMax !== undefined) {
    out.push(`< ${exclusiveMax}`);
  }
  if (out.length > 1) return out.join(" ");
}
