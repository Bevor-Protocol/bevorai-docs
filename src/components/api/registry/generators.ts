import type { MediaAdapter, RequestDataWithUrl } from "./adapters";

export interface CodeGenerator {
  label?: string;
  lang: string;
  generate: (
    data: RequestDataWithUrl,
    context: { mediaAdapters: Record<string, MediaAdapter>; custom: unknown },
  ) => string;
}
