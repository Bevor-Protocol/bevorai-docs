import type { ParsedSchema } from "@fumadocs/api-docs/schema";
import { Suspense, use } from "react";
import { ClientCodeBlock } from "@/components/api/playground/codeblock";
import { SchemaUI } from "@/components/api/schema/index";
import { getOpenAPISchema } from "@/server/schema";

const cache = new Map<string, Promise<ParsedSchema>>();

const load = (name: string) => {
  let promise = cache.get(name);

  if (!promise) {
    promise = getOpenAPISchema({ data: name }) as Promise<ParsedSchema>;
    cache.set(name, promise);
  }

  return promise;
};

const Content = ({ name, as }: { name: string; as: "property" | "body" }) => {
  const root = use(load(name));

  return (
    <SchemaUI
      root={root}
      client={{ name, as, rootId: "inline" }}
      renderMarkdown={(md) => md}
      renderCodeblock={(props) => <ClientCodeBlock {...props} />}
    />
  );
};

export const APISchema = ({ name, as = "body" }: { name: string; as?: "property" | "body" }) => (
  <Suspense fallback={<div className="my-4 h-24 animate-pulse rounded-xl border bg-fd-card" />}>
    <Content name={name} as={as} />
  </Suspense>
);
