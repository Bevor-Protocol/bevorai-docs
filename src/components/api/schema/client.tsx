import { useTranslations } from "@fuma-translate/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fumadocs/api-docs/components/select";
import { cva } from "class-variance-authority";
import { CheckIcon, LinkIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  Fragment,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useCopyButton } from "@/hooks/use-copy-button";
import { cn } from "../../../lib/cn";
import { mergeRefs } from "../../../lib/merge-refs";
import { buttonVariants } from "../../ui/button";
import type { SchemaData, SchemaUIGeneratedData } from "./index";

export interface PathItemType {
  name: string;
  $ref: string;
  scrollTop?: number;
  /** property name of highlighted field, only applicable for objects */
  highlighted?: string;
  tabValues?: string[];
  /** popover state, only applicable for root */
  closed?: boolean;
}

interface StateContextType {
  rootId: string;
  /** the first tiem will always be the root item */
  path: PathItemType[];
  setPath: (path: PathItemType[]) => void;
  generated: SchemaUIGeneratedData;
  renderTypeInfoTrigger: (props: {
    pathName: string;
    $ref: string;
    children: ReactNode;
  }) => ReactNode;
}

export const typeVariants = cva("text-sm text-start text-fd-muted-foreground font-mono", {
  variants: {
    variant: {
      trigger:
        "underline hover:text-fd-accent-foreground data-popup-open:text-fd-accent-foreground",
    },
  },
});

export const Context = createContext<StateContextType | null>(null);

function useStates() {
  return use(Context)!;
}

function SchemaDescription({
  schema,
  hideInline,
  ...props
}: ComponentProps<"div"> & { schema: SchemaData; hideInline?: boolean }) {
  const tags = hideInline ? schema.infoTags?.filter((tag) => tag.block) : schema.infoTags;
  return (
    <div {...props} className={cn("prose-no-margin py-2 empty:hidden", props.className)}>
      {schema.description}
      {tags && tags.length > 0 && (
        <div className="flex flex-row gap-2 flex-wrap mt-2 empty:hidden">
          {tags.map((tag, i) => (
            <Fragment key={i}>{tag.node}</Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export function ObjectProperty({
  name,
  $type,
  required,
  parentPathIndex,
  ...props
}: ComponentProps<"div"> & {
  name: string;
  $type: string;
  parentPathIndex: number;
  required?: boolean;
}) {
  const t = useTranslations({ note: "schema UI" });
  const {
    path,
    generated: { refs },
    rootId,
  } = useStates();

  const schema = refs[$type];
  const parentItem = path[parentPathIndex];
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || parentItem.highlighted !== name) return;

      window.setTimeout(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
        delete parentItem.highlighted;
      }, 300);
    },
    [parentItem, name],
  );
  const [isChecked, onClick] = useCopyButton(() => {
    const url = new URL(window.location.href);
    url.hash = `#${rootId}`;
    url.searchParams.set("s-highlight", name);
    url.searchParams.set("path", encodePath(path));
    return navigator.clipboard.writeText(url.href);
  });

  return (
    <div
      {...props}
      ref={mergeRefs(props.ref, ref)}
      className={cn("text-sm border-t py-4 scroll-m-20", props.className)}
    >
      <div className="flex flex-wrap items-center gap-2 not-prose">
        <span className="font-medium font-mono">
          <span
            className={cn(
              parentItem.highlighted === name
                ? "bg-fd-primary text-fd-primary-foreground rounded-sm"
                : "text-fd-primary",
              schema.deprecated && "line-through opacity-80",
            )}
          >
            {name}
          </span>
          {required ? (
            <span className="text-red-400">*</span>
          ) : (
            <span className="text-fd-muted-foreground">?</span>
          )}
        </span>
        {schema.type === "primitive" ? (
          <span className={cn(typeVariants())}>{schema.aliasName}</span>
        ) : (
          <TypeInfoTrigger pathName={name} $ref={$type}>
            {schema.aliasName}
          </TypeInfoTrigger>
        )}

        {schema.infoTags
          ?.filter((tag) => !tag.block)
          .map((tag, i) => (
            <Fragment key={i}>{tag.node}</Fragment>
          ))}

        <div className="ml-auto flex items-center gap-2">
          {schema.deprecated && (
            <span className="text-xs font-mono text-yellow-600 dark:text-yellow-400">
              {t("Deprecated")}
            </span>
          )}
          <button
            className={cn(
              buttonVariants({ size: "icon-xs", variant: "ghost" }),
              "text-fd-muted-foreground [&_svg]:size-3.5",
            )}
            onClick={onClick}
          >
            {isChecked ? <CheckIcon /> : <LinkIcon />}
          </button>
        </div>
      </div>
      <SchemaDescription schema={schema} className="pb-0" hideInline />
    </div>
  );
}

export function PathItemBody({
  pathIndex,
  asSchema,
  tabDepth = 0,
  objectSearchOverrides,
}: {
  pathIndex: number;
  asSchema?: SchemaData;
  tabDepth?: number;
  objectSearchOverrides?: Partial<ObjectSearchProps>;
}) {
  const {
    path,
    setPath,
    generated: { refs },
  } = useStates();
  const schema = asSchema ?? refs[path[pathIndex].$ref];

  if ((schema.type === "or" || schema.type === "and") && schema.items.length > 0) {
    const value = path[pathIndex].tabValues?.[tabDepth] ?? schema.items[0].$type;
    const discriminatorEntries = Object.entries(schema.discriminator?.mapping ?? {});

    const items = schema.items.map((item) => {
      const discriminatorKey = discriminatorEntries.find(([, ref]) => ref === item.itemId)?.[0];
      return {
        label: (
          <code className="text-xs font-medium">
            {item.name}
            {discriminatorKey && schema.discriminator?.propertyName && (
              <span className="ml-1.5 font-normal text-fd-muted-foreground">
                ({schema.discriminator.propertyName}: {discriminatorKey})
              </span>
            )}
          </code>
        ),
        value: item.$type,
      };
    });

    return (
      <Select
        items={items}
        value={value}
        onValueChange={(v) => {
          if (!v) return;
          const next = [...path];
          (next[pathIndex].tabValues ??= []).splice(tabDepth, 1, v);
          setPath(next);
        }}
      >
        <div className="flex flex-row my-2 gap-2 items-center">
          <SchemaDescription schema={schema} className="flex-1 py-0" />
          <SelectTrigger className="not-prose w-fit min-w-0 mb-auto *:min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map(({ label, value }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </div>
        <PathItemBody asSchema={refs[value]} pathIndex={pathIndex} tabDepth={tabDepth + 1} />
      </Select>
    );
  }
  if (schema.type === "object" && schema.props.length > 0) {
    return (
      <>
        <SchemaDescription schema={schema} />
        {schema.props.map((item) => (
          <ObjectProperty
            key={item.name}
            name={item.name}
            $type={item.$type}
            required={item.required}
            parentPathIndex={pathIndex}
          />
        ))}
      </>
    );
  }
  if (schema.type === "array") {
    return (
      <>
        <SchemaDescription schema={schema} />
        <ObjectProperty
          name="[index: integer]"
          $type={schema.item.$type}
          parentPathIndex={pathIndex}
        />
      </>
    );
  }

  return <SchemaDescription schema={schema} />;
}

interface ObjectSearchProps {
  variant?: "default" | "in-popover";
  pathIndex: number;
  schema: Extract<SchemaData, { type: "object" }>;
  children?: ReactNode;
}

export function InlineTag({
  label,
  prose = false,
  children,
}: {
  label: ReactNode;
  prose?: boolean;
  children: ReactNode;
}) {
  if (prose) {
    return (
      <div className="inline-flex gap-2 bg-fd-secondary border rounded-lg text-xs p-1.5 shadow-md max-w-full">
        <span className="font-medium not-prose">{label}</span>
        <span className="min-w-0 flex-1 text-fd-muted-foreground prose-sm prose-no-margin">
          {children}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex gap-2 bg-fd-secondary border rounded-lg text-xs p-1.5 shadow-md max-w-full not-prose">
      <span className="font-medium">{label}</span>
      <code className="min-w-0 flex-1 text-fd-muted-foreground wrap-break-word">{children}</code>
    </div>
  );
}

export function BlockTag({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col w-full gap-2 border rounded-lg p-1.5 shadow-md not-prose">
      <p className="font-medium text-xs">{label}</p>
      {children}
    </div>
  );
}

export function SchemaUIPopover() {
  const states = useStates();
  const { path, setPath } = states;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current
      ?.querySelector<HTMLInputElement>("input[data-object-search-input]")
      ?.focus({ preventScroll: true });
  }, [path]);

  return (
    <Context
      value={useMemo(
        () => ({
          ...states,
          renderTypeInfoTrigger: ({ $ref, pathName, children }) => (
            <button
              className={cn(typeVariants({ variant: "trigger" }))}
              onClick={() => setPath([...path, { name: pathName, $ref }])}
            >
              {children}
            </button>
          ),
        }),
        [states, setPath, path],
      )}
    >
      <div ref={ref}>
        <div className="sticky top-0 -mx-3 flex overflow-x-auto overflow-y-hidden items-center text-sm font-medium font-mono bg-fd-secondary text-fd-secondary-foreground px-3 h-10 border-b z-20">
          {path.map((item, i) => {
            // ignore root
            if (i === 0) return;
            const isDuplicated = path.some((other, j) => j !== i && other.$ref === item.$ref);

            let text: string;
            const indexItemMatch = /^\[(\w+): (\w+)]$/.exec(item.name);
            if (indexItemMatch) {
              text = `[${indexItemMatch[1]}]`;
            } else if (i > 1) {
              text = `.${item.name}`;
            } else {
              text = item.name;
            }

            return (
              <button
                key={i}
                onClick={() => setPath(path.slice(0, i + 1))}
                className={cn(
                  "hover:underline hover:text-fd-accent-foreground",
                  isDuplicated && "text-orange-400",
                )}
              >
                {text}
              </button>
            );
          })}
        </div>
        <PathItemBody
          pathIndex={path.length - 1}
          objectSearchOverrides={{
            variant: "in-popover",
          }}
        />
      </div>
    </Context>
  );
}

function TypeInfoTrigger({
  pathName,
  $ref,
  children,
}: {
  pathName: string;
  $ref: string;
  children: ReactNode;
}) {
  const {
    generated: { refs },
    renderTypeInfoTrigger,
  } = useStates();
  const schema = refs[$ref];

  if (
    schema.type === "primitive" &&
    !schema.description &&
    (!schema.infoTags || schema.infoTags.length === 0)
  ) {
    return <span className={cn(typeVariants())}>{children}</span>;
  }

  if (schema.type === "and" || schema.type === "or") {
    const sep = schema.type === "and" ? "&" : "|";
    return (
      <span className={cn(typeVariants(), "flex flex-row gap-2 items-center flex-wrap")}>
        {schema.items.map((item, i) => (
          <Fragment key={item.$type}>
            {i > 0 && <span>{sep}</span>}
            <TypeInfoTrigger pathName={pathName} $ref={item.$type}>
              {item.name}
            </TypeInfoTrigger>
          </Fragment>
        ))}
      </span>
    );
  }

  if (schema.type === "array") {
    return (
      <span className={cn(typeVariants(), "flex flex-row items-center flex-wrap")}>
        {"array<"}
        <TypeInfoTrigger pathName={`${pathName}[]`} $ref={schema.item.$type}>
          {refs[schema.item.$type].aliasName}
        </TypeInfoTrigger>
        {">"}
      </span>
    );
  }

  return renderTypeInfoTrigger({ $ref, pathName, children });
}

function encodePath(path: PathItemType[]): string {
  return path.map((item) => [item.name, item.$ref, ...(item.tabValues ?? [])].join("\0")).join("|");
}

export function decodePath(path: string, highlighted: string | null): PathItemType[] | null {
  const out: PathItemType[] = [];
  for (const part of path.split("|")) {
    const [name, $ref, ...tabValues] = part.split("\0");
    out.push({ name, $ref, tabValues });
  }

  if (highlighted && out.length > 0) out[out.length - 1].highlighted = highlighted;
  return out;
}
