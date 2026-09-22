import type { ParsedSchema } from "@fumadocs/api-docs/schema";
import type { SchemaData } from "@fumadocs/json-schema/react";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RefsContext, useRefs } from "@/hooks/use-refs";
import { cn } from "@/lib/cn";
import { generateSchemaTree } from ".";
import {
  DefaultTag,
  EnumTag,
  ItemsRangeTag,
  LengthTag,
  MatchTag,
  MultipleOfTag,
  RangeTag,
} from "./tags";

interface SchemaNodeProps {
  $type: string;
  name: string;
  required: boolean;
  depth: number;
}

export const SchemaNode = ({ $type, name, required, depth }: SchemaNodeProps) => {
  const refs = useRefs();
  const schema = refs[$type];
  if (!schema) return null;

  return (
    <div className="border-b py-3 last:border-b-0" style={{ marginInlineStart: depth * 16 }}>
      <div className="flex flex-wrap items-baseline gap-4">
        <code className="font-medium text-fd-foreground">{name}</code>
        <code className="text-xs text-fd-muted-foreground">{schema.aliasName}</code>
        {required && (
          <Badge color="blue" size="xs">
            required
          </Badge>
        )}
        {schema.default && <DefaultTag value={schema.default} />}
        {schema.deprecated && (
          <Badge size="sm" color="yellow">
            Deprecated
          </Badge>
        )}
      </div>

      {schema.description && (
        <div className="mt-3 text-sm text-fd-muted-foreground">{schema.description}</div>
      )}

      {schema.pattern && <MatchTag value={schema.pattern} />}
      {schema.multipleOf !== undefined && <MultipleOfTag value={schema.multipleOf} />}
      {schema.valueRange && <RangeTag value={schema.valueRange} />}
      {schema.lengthRange && <LengthTag value={schema.lengthRange} />}
      {schema.itemsRange && <ItemsRangeTag value={schema.itemsRange} />}
      {schema.enum && <EnumTag values={schema.enum} />}

      <SchemaChildren schema={schema} depth={depth} />
    </div>
  );
};

const SchemaChildren = ({ schema, depth }: { schema: SchemaData; depth: number }) => {
  const refs = useRefs();
  const [open, setOpen] = useState(depth === 0);

  if (schema.type === "primitive") return null;

  if (schema.type === "array") {
    const item = refs[schema.item.$type];
    if (!item || item.type === "primitive") return null;
    // skip the redundant "[item]: TypeName" hop — expand straight into the item's own properties/variants
    return <SchemaChildren schema={item} depth={depth} />;
  }

  if (schema.type === "object") {
    if (schema.props.length === 0) return null;
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="mt-2 flex items-center gap-1 text-xs font-medium text-fd-muted-foreground hover:text-fd-foreground">
          <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
          {open ? "Hide" : "Show"} properties
          {schema.props.length ? ` (${schema.props.length})` : ""}
        </CollapsibleTrigger>
        <CollapsibleContent>
          {schema.props.map((prop) => (
            <SchemaNode
              key={prop.$type + prop.name}
              $type={prop.$type}
              name={prop.name}
              required={prop.required}
              depth={depth + 1}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="mt-2 flex items-center gap-1 text-xs font-medium text-fd-muted-foreground hover:text-fd-foreground">
        <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />
        {open ? "Hide" : "Show"} variants ({schema.items.length})
      </CollapsibleTrigger>
      <CollapsibleContent>
        {schema.items.map((item) => (
          <SchemaNode
            key={item.$type}
            $type={item.$type}
            name={item.name}
            required={false}
            depth={depth + 1}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

interface SchemaBlockProps {
  name: string;
  root: ParsedSchema;
  bundled: object;
  description?: string;
  required?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
}

export const SchemaBlock = ({
  name,
  root,
  bundled,
  description,
  required = false,
  readOnly = false,
  writeOnly = false,
}: SchemaBlockProps) => {
  const schema: ParsedSchema =
    description && typeof root === "object" ? { ...root, description } : root;

  const tree = useMemo(
    () => generateSchemaTree({ root: schema, bundled, readOnly, writeOnly }),
    [schema, bundled, readOnly, writeOnly],
  );

  return (
    <RefsContext value={tree.refs}>
      <SchemaNode $type={tree.$root} name={name} required={required} depth={0} />
    </RefsContext>
  );
};
