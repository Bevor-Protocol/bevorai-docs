import type { ParsedSchema } from "@fumadocs/api-docs/schema";
import { Suspense, use } from "react";
import { getOpenAPISchema } from "@/server/schema";
import { SchemaBlock } from "./schema/client";

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

  return <SchemaBlock name={name} root={root} />;
};

export const APISchema = ({ name, as = "body" }: { name: string; as?: "property" | "body" }) => (
  <Suspense fallback={<div className="my-4 h-24 animate-pulse rounded-xl border bg-fd-card" />}>
    <Content name={name} as={as} />
  </Suspense>
);
