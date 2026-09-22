import type { ReactNode } from "react";

export interface ParsedSchemaObject {
  $ref?: string;
  type?: string | string[];
  description?: string;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  pattern?: string;
  format?: string;
  multipleOf?: number;
  minimum?: number;
  exclusiveMinimum?: number | boolean;
  maximum?: number;
  exclusiveMaximum?: number | boolean;
  minLength?: number;
  maxLength?: number;
  minProperties?: number;
  maxProperties?: number;
  minItems?: number;
  maxItems?: number;
  enum?: unknown[];
  default?: unknown;
  examples?: unknown[];
  oneOf?: ParsedSchema[];
  anyOf?: ParsedSchema[];
  allOf?: ParsedSchema[];
  discriminator?: { propertyName: string; mapping?: Record<string, string> };
  properties?: Record<string, ParsedSchema>;
  patternProperties?: Record<string, ParsedSchema>;
  additionalProperties?: ParsedSchema | boolean;
  items?: ParsedSchema;
  required?: string[];
}
export type ParsedSchema = boolean | ParsedSchemaObject;

export interface InfoTag {
  node: ReactNode;
}

export interface FieldBase {
  description?: string;
  infoTags: InfoTag[];
  typeName: string;
  aliasName: string;
  deprecated?: boolean;
}

export type SchemaData =
  | ({ type: "primitive" } & FieldBase)
  | ({ type: "array"; item: { $type: string } } & FieldBase)
  | ({ type: "object"; props: { $type: string; name: string; required: boolean }[] } & FieldBase)
  | ({ type: "or"; items: { name: string; $type: string }[]; discriminator?: unknown } & FieldBase)
  | ({ type: "and"; items: { name: string; $type: string }[] } & FieldBase);

const resolveJsonPointer = (ref: string, bundled: object): ParsedSchema => {
  const path = ref.replace(/^#\//, "").split("/");
  let node: unknown = bundled;
  for (const segment of path) {
    const key = segment.replace(/~1/g, "/").replace(/~0/g, "~");
    node = (node as Record<string, unknown> | undefined)?.[key];
  }
  return node as ParsedSchema;
};

const dereferenceShallow = (schema: ParsedSchema, bundled: object): ParsedSchema => {
  if (typeof schema === "boolean") return schema;
  if (typeof schema.$ref === "string")
    return dereferenceShallow(resolveJsonPointer(schema.$ref, bundled), bundled);
  return schema;
};

const mergeAllOf = (schema: ParsedSchemaObject): ParsedSchemaObject => {
  const merged: ParsedSchemaObject = {
    ...schema,
    allOf: undefined,
    properties: { ...schema.properties },
    required: [...(schema.required ?? [])],
  };
  for (const sub of schema.allOf ?? []) {
    if (typeof sub === "boolean") continue;
    merged.properties = { ...merged.properties, ...sub.properties };
    merged.required = [...(merged.required ?? []), ...(sub.required ?? [])];
    if (sub.type && !merged.type) merged.type = sub.type;
  }
  return merged;
};

const schemaToString = (schema: ParsedSchema, useAlias: boolean, bundled: object): string => {
  if (typeof schema === "boolean") return schema ? "any" : "never";
  if (typeof schema.$ref === "string") {
    if (useAlias) return schema.$ref.split("/").pop() ?? "object";
    return schemaToString(resolveJsonPointer(schema.$ref, bundled), useAlias, bundled);
  }
  if (schema.enum) return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  if (schema.oneOf)
    return schema.oneOf.map((s) => schemaToString(s, useAlias, bundled)).join(" | ");
  if (schema.anyOf)
    return schema.anyOf.map((s) => schemaToString(s, useAlias, bundled)).join(" | ");
  if (schema.allOf)
    return schema.allOf.map((s) => schemaToString(s, useAlias, bundled)).join(" & ");
  if (Array.isArray(schema.type)) return schema.type.join(" | ");
  if (schema.type === "array")
    return `${schema.items ? schemaToString(schema.items, useAlias, bundled) : "unknown"}[]`;
  return schema.type ?? "object";
};

const formatRange = (
  unit: string,
  min: number | undefined,
  exclusiveMin: number | boolean | undefined,
  max: number | undefined,
  exclusiveMax: number | boolean | undefined,
): string | undefined => {
  if (min === undefined && max === undefined) return undefined;
  const lo = typeof exclusiveMin === "number" ? exclusiveMin : min;
  const hi = typeof exclusiveMax === "number" ? exclusiveMax : max;
  const loOpen = typeof exclusiveMin === "number" || exclusiveMin === true;
  const hiOpen = typeof exclusiveMax === "number" || exclusiveMax === true;
  if (lo !== undefined && hi !== undefined)
    return `${loOpen ? "(" : "["}${lo}, ${hi}${hiOpen ? ")" : "]"} ${unit}`;
  if (lo !== undefined) return `>${loOpen ? "" : "="} ${lo} ${unit}`;
  return `<${hiOpen ? "" : "="} ${hi} ${unit}`;
};

const generateInfoTags = (schema: ParsedSchemaObject): InfoTag[] => {
  const tags: InfoTag[] = [];
  if (schema.pattern) tags.push({ node: <InlineTag label="Match">{schema.pattern}</InlineTag> });
  if (schema.format) tags.push({ node: <InlineTag label="Format">{schema.format}</InlineTag> });
  if (schema.multipleOf)
    tags.push({ node: <InlineTag label="Multiple of">{schema.multipleOf}</InlineTag> });

  const valueRange = formatRange(
    "",
    schema.minimum,
    schema.exclusiveMinimum,
    schema.maximum,
    schema.exclusiveMaximum,
  );
  if (valueRange) tags.push({ node: <InlineTag label="Range">{valueRange}</InlineTag> });

  const lengthRange = formatRange(
    "chars",
    schema.minLength,
    undefined,
    schema.maxLength,
    undefined,
  );
  if (lengthRange) tags.push({ node: <InlineTag label="Length">{lengthRange}</InlineTag> });

  const itemsRange = formatRange("items", schema.minItems, undefined, schema.maxItems, undefined);
  if (itemsRange) tags.push({ node: <InlineTag label="Items">{itemsRange}</InlineTag> });

  if (schema.enum && schema.enum.length > 0) {
    const members = schema.enum.map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
    tags.push({ node: <InlineTag label="Value in">{members.join(", ")}</InlineTag> });
  }

  if (schema.default !== undefined) {
    tags.push({ node: <InlineTag label="Default">{JSON.stringify(schema.default)}</InlineTag> });
  }

  return tags;
};

const InlineTag = ({ label, children }: { label: string; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1 rounded-md border bg-fd-secondary px-1.5 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
    <span className="font-medium text-fd-foreground">{label}</span>
    {children}
  </span>
);

interface GenerateSchemaTreeOptions {
  root: ParsedSchema;
  bundled: object;
  readOnly: boolean;
  writeOnly: boolean;
}

export interface SchemaTree {
  refs: Record<string, SchemaData>;
  $root: string;
}

export const generateSchemaTree = ({
  root,
  bundled,
  readOnly,
  writeOnly,
}: GenerateSchemaTreeOptions): SchemaTree => {
  const refs: Record<string, SchemaData> = {};
  let counter = 0;
  const autoIds = new WeakMap<ParsedSchemaObject, string>();

  const getSchemaId = (schema: ParsedSchema): string => {
    if (typeof schema === "boolean") return String(schema);
    if (typeof schema.$ref === "string") return schema.$ref;
    const prev = autoIds.get(schema);
    if (prev) return prev;
    const id = `__${counter++}`;
    autoIds.set(schema, id);
    return id;
  };

  const isVisible = (raw: ParsedSchema): boolean => {
    const schema = dereferenceShallow(raw, bundled);
    if (typeof schema === "boolean") return true;
    if (schema.writeOnly) return writeOnly;
    if (schema.readOnly) return readOnly;
    return true;
  };

  const base = (raw: ParsedSchema): FieldBase => {
    const schema = dereferenceShallow(raw, bundled);
    if (typeof schema === "boolean") {
      const name = schema ? "any" : "never";
      return { typeName: name, aliasName: name, infoTags: [] };
    }
    return {
      description: schema.description,
      infoTags: generateInfoTags(schema),
      typeName: schemaToString(raw, false, bundled),
      aliasName: schemaToString(raw, true, bundled),
      deprecated: schema.deprecated,
    };
  };

  const scanRefs = (id: string, raw: ParsedSchema): void => {
    if (id in refs) return;
    const schema = dereferenceShallow(raw, bundled);

    if (typeof schema === "boolean") {
      refs[id] = { type: "primitive", ...base(raw) };
      return;
    }

    if (Array.isArray(schema.type)) {
      const out: SchemaData = { type: "or", items: [], ...base(raw) };
      refs[id] = out;
      for (const type of schema.type) {
        const key = `${id}_type:${type}`;
        scanRefs(key, { ...schema, type });
        out.items.push({ name: type, $type: key });
      }
      return;
    }

    if (schema.oneOf && schema.anyOf) {
      const out: SchemaData = { type: "and", items: [], ...base(raw) };
      refs[id] = out;
      for (const omit of ["anyOf", "oneOf"] as const) {
        const key = `${id}_omit:${omit}`;
        scanRefs(key, { ...schema, [omit]: undefined });
        out.items.push({ name: refs[key].aliasName, $type: key });
      }
      return;
    }

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
        const item = dereferenceShallow(rawItem, bundled);
        if (typeof item !== "object") continue;
        const key = `${id}_extends:${itemId}`;
        scanRefs(key, {
          ...schema,
          oneOf: undefined,
          anyOf: undefined,
          ...item,
          properties: { ...schema.properties, ...item.properties },
        });
        out.items.push({
          $type: key,
          name: refs[itemId]?.aliasName ?? schemaToString(rawItem, true, bundled),
        });
      }
      return;
    }

    if (schema.allOf) {
      scanRefs(id, mergeAllOf(schema));
      return;
    }

    if (schema.type === "object") {
      const out: SchemaData = { type: "object", props: [], ...base(raw) };
      refs[id] = out;
      const { properties = {}, patternProperties, additionalProperties } = schema;
      const props = Object.entries(properties);
      if (patternProperties) props.push(...Object.entries(patternProperties));
      for (const [key, prop] of props) {
        if (!prop || !isVisible(prop)) continue;
        const $type = getSchemaId(prop);
        scanRefs($type, prop);
        out.props.push({ $type, name: key, required: schema.required?.includes(key) ?? false });
      }
      if (
        additionalProperties &&
        typeof additionalProperties === "object" &&
        isVisible(additionalProperties)
      ) {
        const $type = getSchemaId(additionalProperties);
        scanRefs($type, additionalProperties);
        out.props.push({ $type, name: "[key: string]", required: false });
      }
      return;
    }

    if (schema.type === "array") {
      const items = schema.items ?? true;
      const $type = getSchemaId(items);
      refs[id] = { type: "array", item: { $type }, ...base(raw) };
      scanRefs($type, items);
      return;
    }

    refs[id] = { type: "primitive", ...base(raw) };
  };

  const $root = getSchemaId(root);
  scanRefs($root, root);
  return { refs, $root };
};
