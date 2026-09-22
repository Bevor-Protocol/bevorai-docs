import { createContext, use } from "react";
import type { SchemaData } from "@/components/api/schema";

export const RefsContext = createContext<Record<string, SchemaData> | null>(null);

export const useRefs = (): Record<string, SchemaData> => {
  const ctx = use(RefsContext);
  if (!ctx) throw new Error("useRefs() called outside <SchemaBlock>");
  return ctx;
};
