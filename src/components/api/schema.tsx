
import type { OpenAPIComponents } from "fumadocs-openapi";
import { Schema as CustomSchema } from "@/components/api/schema/index";

export const SchemaUI: OpenAPIComponents["SchemaUI"] = (props) => <CustomSchema {...props} />;

export { SchemaUI as Schema };
