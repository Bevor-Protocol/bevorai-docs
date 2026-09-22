import { resolveMediaAdapter } from "./adapters";
import type { CodeGenerator } from "./generators";
import { doubleQuote } from "./utils";

export const generatePythonObject = (v: unknown, imports: Set<string>): string => {
  if (v === null) return "None";
  if (typeof v === "boolean") return v ? "True" : "False";
  if (typeof v === "string") return doubleQuote(v);
  if (typeof v === "number") return v.toString();
  if (Array.isArray(v))
    return `[${v.map((item) => generatePythonObject(item, imports)).join(", ")}]`;
  if (v instanceof Date) {
    imports.add("datetime");
    return `datetime.datetime(${v.getFullYear()}, ${v.getMonth() + 1}, ${v.getDate()}, ${v.getHours()}, ${v.getMinutes()}, ${v.getSeconds()}, ${v.getMilliseconds()})`;
  }
  if (typeof v === "object") {
    return `{\n${Object.entries(v as Record<string, unknown>)
      .map(([key, value]) => `  ${doubleQuote(key)}: ${generatePythonObject(value, imports)}`)
      .join(", \n")}\n}`;
  }
  throw new Error(`Unsupported type: ${typeof v}`);
};

export const pythonGenerator: CodeGenerator = {
  label: "Python",
  lang: "python",
  generate: (data, { mediaAdapters }) => {
    const headers: Record<string, string> = {};
    const imports = new Set<string>();
    const params = [`"${data.method.toUpperCase()}"`, "url"];
    let body: string | undefined;
    imports.add("requests");

    if (data.body && data.bodyMediaType) {
      const adapter = resolveMediaAdapter(data.bodyMediaType, mediaAdapters);
      headers["Content-Type"] = data.bodyMediaType;
      body = adapter?.generateExample(data, { lang: "python" });
      if (body) params.push("data = body");
    }

    for (const [k, v] of Object.entries(data.header)) headers[k] = v.value;
    if (Object.keys(headers).length > 0)
      params.push(`headers = ${generatePythonObject(headers, imports)}`);

    const inputCookies = Object.entries(data.cookie);
    if (inputCookies.length > 0) {
      const cookies: Record<string, string> = {};
      for (const [k, v] of inputCookies) cookies[k] = v.value;
      params.push(`cookies = ${generatePythonObject(cookies, imports)}`);
    }

    return `${Array.from(imports)
      .map((name) => "import " + name)
      .join("\n")}

url = ${doubleQuote(data.url)}
${body ?? ""}
response = requests.request(${params.join(", ")})

print(response.text)`;
  },
};
