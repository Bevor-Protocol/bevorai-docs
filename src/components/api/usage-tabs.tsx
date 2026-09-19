"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fumadocs/api-docs/components/select";
import { idToTitle } from "@fumadocs/api-docs/utils/id-to-title";
import { joinURL, resolveServerUrl } from "@fumadocs/api-docs/utils/url";
import type { HttpMethods, OperationObject, PathItemObject, RenderContext } from "fumadocs-openapi";
import {
  type CodeUsageGeneratorRegistry,
  pathnameFromRequest,
} from "fumadocs-openapi/requests/generators";
import { useOperationContext, useRenderContext, useServerContext } from "fumadocs-openapi/ui";
import type { CodeBlockProps } from "fumadocs-ui/components/codeblock";
import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "@/components/api/copy-button";
import { ClientCodeBlock } from "@/components/api/playground/codeblock";
import { useSharedSelection } from "@/components/api/use-shared-selection";

const PLACEHOLDER_ORIGIN = "https://example.com";

const GROUP_ID = "fumadocs_openapi_requests";

const CODE_BLOCK_PROPS = {
  allowCopy: false,
  className: "my-0 rounded-none border-0 bg-transparent shadow-none",
} satisfies CodeBlockProps;

type EncodedRequest = ReturnType<typeof useOperationContext>["examples"][number]["encoded"];

const useEncodedRequest = (): EncodedRequest | undefined => {
  const { examples, example: selectedId, addListener, removeListener } = useOperationContext();
  const [data, setData] = useState(
    () => examples.find((example) => example.id === selectedId)?.encoded,
  );

  useEffect(() => {
    const listener = (_raw: unknown, encoded: EncodedRequest) => setData(encoded);
    addListener(listener);
    return () => removeListener(listener);
  }, [addListener, removeListener]);

  return data;
};

const useRequestOrigin = (): string => {
  const { server } = useServerContext();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!server || !mounted) return PLACEHOLDER_ORIGIN;
  return new URL(resolveServerUrl(server.url, server.variables), window.location.origin).href;
};

const useOperationName = (ctx: RenderContext, method: HttpMethods | undefined) => {
  const { route } = useOperationContext();

  return useMemo(() => {
    if (!method) return;

    const pathItem: PathItemObject | undefined = ctx.schema.dereferenced.paths?.[route];
    const operation: OperationObject | undefined = pathItem?.[method];
    if (!operation) return;

    return (
      operation.summary ??
      pathItem?.summary ??
      (operation.operationId ? idToTitle(operation.operationId) : undefined)
    );
  }, [ctx, route, method]);
};

/**
 * Replaces the default `CodeBlockTabs` from `fumadocs-ui`. Reads generators off the registry the
 * page hands us, which includes any `x-codeSamples` declared on the operation.
 */
export const UsageTabs = ({
  registry,
  ctx,
}: {
  registry: CodeUsageGeneratorRegistry;
  ctx: RenderContext;
}) => {
  const { mediaAdapters } = useRenderContext();
  const { route } = useOperationContext();
  const items = useMemo(() => Array.from(registry.map().entries()), [registry]);
  const [activeId, setActiveId] = useSharedSelection(GROUP_ID);

  const data = useEncodedRequest();
  const origin = useRequestOrigin();
  const name = useOperationName(ctx, data?.method);

  const [id, generator] = items.find(([value]) => value === activeId) ?? items[0] ?? [];

  const code = useMemo(() => {
    if (!data || !generator) return;

    return generator.generate(
      { ...data, url: joinURL(origin, pathnameFromRequest(route, data)) },
      { mediaAdapters, custom: null },
    );
  }, [data, generator, origin, route, mediaAdapters]);

  if (!generator) return null;

  return (
    <div className="not-prose overflow-hidden rounded-xl border bg-fd-card">
      <div className="flex flex-row items-center gap-2 border-b p-1.5 ps-3">
        <span className="min-w-0 flex-1 truncate text-xs font-medium empty:hidden">{name}</span>
        <Select
          items={items.map(([value, item]) => ({ value, label: item.label ?? item.lang }))}
          value={id}
          onValueChange={(value) => value !== null && setActiveId(value)}
        >
          <SelectTrigger className="w-auto gap-1.5 border-none bg-transparent py-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map(([value, item]) => (
              <SelectItem key={value} value={value}>
                {item.label ?? item.lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {code && <CopyButton code={code} />}
      </div>
      {code && <ClientCodeBlock lang={generator.lang} code={code} codeblock={CODE_BLOCK_PROPS} />}
    </div>
  );
};
