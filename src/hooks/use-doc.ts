import { dereference } from "@fumadocs/json-schema";
import { createMagicProxy } from "@scalar/json-magic/magic-proxy";
import type { ReferenceObject } from "fumadocs-openapi";
import { createContext, use, useMemo } from "react";

export interface Doc {
  bundled: object;
  dereferenced: any;
  resolve: <T>(node: T | ReferenceObject) => T;
}

const dereferenceBundledDocument = (bundled: object): Doc => ({
  bundled,
  dereferenced: createMagicProxy(bundled),
  resolve: (node) => dereference(node),
});

export const useDereferencedDocument = (bundled: object) =>
  useMemo(() => dereferenceBundledDocument(bundled), [bundled]);

export const DocContext = createContext<Doc | null>(null);

export const useDoc = (): Doc => {
  const ctx = use(DocContext);
  if (!ctx) throw new Error("useDoc() called outside <OpenAPIPage>");
  return ctx;
};
