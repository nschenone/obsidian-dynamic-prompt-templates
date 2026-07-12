import type { ApiFailure, ApiSuccess, RenderResult, TemplateInfo } from "../contracts";

export interface CliIo {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

export interface CliOptions {
  command: "list" | "render";
  templatePath?: string;
  host: string;
  port: number;
  token?: string;
  referenceDate?: string;
  json: boolean;
  baseUrl?: string;
}

type FetchLike = typeof fetch;

export function parseCliArgs(argv: string[]): CliOptions {
  if (argv.length === 0) {
    throw new Error("Usage: dynamic-prompt <list|render> [template-path] [--reference-date YYYY-MM-DD] [--json]");
  }

  const [commandRaw, maybeTemplatePath, ...rest] = argv;
  if (commandRaw !== "list" && commandRaw !== "render") {
    throw new Error(`Unknown command: ${commandRaw}`);
  }

  let templatePath = commandRaw === "render" && maybeTemplatePath?.startsWith("--") !== true ? maybeTemplatePath : undefined;
  const optionArgs = templatePath ? rest : [maybeTemplatePath, ...rest].filter(Boolean) as string[];

  const options: CliOptions = {
    command: commandRaw,
    templatePath,
    host: "127.0.0.1",
    port: 27131,
    json: false
  };

  for (let index = 0; index < optionArgs.length; index += 1) {
    const arg = optionArgs[index];
    const next = optionArgs[index + 1];
    switch (arg) {
      case "--host":
        options.host = next;
        index += 1;
        break;
      case "--port":
        options.port = Number(next);
        index += 1;
        break;
      case "--token":
        options.token = next;
        index += 1;
        break;
      case "--reference-date":
        options.referenceDate = next;
        index += 1;
        break;
      case "--json":
        options.json = true;
        break;
      case "--base-url":
        options.baseUrl = next;
        index += 1;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

export function createBaseUrl(options: CliOptions): string {
  return options.baseUrl ?? `http://${options.host}:${options.port}`;
}

export function formatTemplateList(templates: TemplateInfo[]): string {
  return templates.map((template) => `${template.path}\t${template.title}`).join("\n");
}

export function formatRenderOutput(result: RenderResult, asJson: boolean): string {
  return asJson ? JSON.stringify({ success: true, data: result }, null, 2) : result.markdown;
}

async function requestJson<T>(fetchImpl: FetchLike, url: string, init?: RequestInit): Promise<T> {
  const response = await fetchImpl(url, init);
  const payload = (await response.json()) as ApiFailure | ApiSuccess<T>;
  if (!response.ok || payload.success === false) {
    throw new Error(payload.success === false ? payload.error : response.statusText);
  }

  return payload.data;
}

export async function runCli(argv: string[], io: CliIo, fetchImpl: FetchLike): Promise<number> {
  const options = parseCliArgs(argv);
  const baseUrl = createBaseUrl(options);
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  if (options.command === "list") {
    const data = await requestJson<{ templates: TemplateInfo[] }>(fetchImpl, `${baseUrl}/templates`, { headers });
    io.stdout(options.json ? JSON.stringify({ success: true, data }, null, 2) : formatTemplateList(data.templates));
    return 0;
  }

  if (!options.templatePath) {
    io.stderr("Template path is required for render. Available templates:\n");
    const data = await requestJson<{ templates: TemplateInfo[] }>(fetchImpl, `${baseUrl}/templates`, { headers });
    io.stderr(formatTemplateList(data.templates));
    return 1;
  }

  const renderData = await requestJson<RenderResult>(fetchImpl, `${baseUrl}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify({ templatePath: options.templatePath, referenceDate: options.referenceDate })
  });

  io.stdout(formatRenderOutput(renderData, options.json));
  return 0;
}
