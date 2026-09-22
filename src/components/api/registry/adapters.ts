import type { HttpMethods } from "fumadocs-openapi";

export interface EncodedParameter {
  value: string;
}

export interface EncodedParameterMultiple {
  values: string[];
}

export interface RequestData {
  method: HttpMethods;
  path: Record<string, EncodedParameter>;
  query: Record<string, EncodedParameterMultiple>;
  header: Record<string, EncodedParameter>;
  cookie: Record<string, EncodedParameter>;
  body?: unknown;
  bodyMediaType?: string;
}

export type RequestDataWithUrl = RequestData & { url: string };

export interface MediaAdapter {
  generateExample: (data: RequestData, context: { lang: string }) => string | undefined;
}

export const resolveMediaAdapter = (
  mediaType: string,
  adapters: Record<string, MediaAdapter>,
): MediaAdapter | undefined => adapters[mediaType] ?? adapters[mediaType.split(";")[0]];
