import type { ParsedSchema } from "@fumadocs/api-docs/schema";
import type { SchemaData } from "@fumadocs/json-schema/react";
import { ChevronRight } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDoc } from "@/hooks/use-doc";
import { RefsContext, useRefs } from "@/hooks/use-refs";
import { cn } from "@/lib/cn";
import { Badge } from "../playground/method-label";
import { generateSchemaTree } from ".";

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
      <div className="flex flex-wrap items-baseline gap-2">
        <code className="font-medium text-fd-foreground">{name}</code>
        <code className="text-xs text-fd-muted-foreground">{schema.aliasName}</code>
        {required && <span className="text-xs text-fd-primary">required</span>}
        {schema.deprecated && (
          <Badge size="sm" color="yellow">
            Deprecated
          </Badge>
        )}
      </div>
      {schema.description && (
        <div className="mt-1 text-sm text-fd-muted-foreground">{schema.description}</div>
      )}
      {schema.infoTags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {schema.infoTags.map((tag, i) => (
            <Fragment key={i}>{tag.node}</Fragment>
          ))}
        </div>
      )}
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
  description?: string;
  required?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
}

export const SchemaBlock = ({
  name,
  root,
  description,
  required = false,
  readOnly = false,
  writeOnly = false,
}: SchemaBlockProps) => {
  const doc = useDoc();
  const schema: ParsedSchema =
    description && typeof root === "object" ? { ...root, description } : root;

  const tree = useMemo(
    () => generateSchemaTree({ root: schema, bundled: doc.bundled, readOnly, writeOnly }),
    [schema, doc.bundled, readOnly, writeOnly],
  );

  return (
    <RefsContext value={tree.refs}>
      <SchemaNode $type={tree.$root} name={name} required={required} depth={0} />
    </RefsContext>
  );
};
