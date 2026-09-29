import { Notice, Platform, Plugin } from "obsidian";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { ApiFailure, ApiSuccess, DynamicPromptSettings, RenderRequestBody, RenderResult, TemplateInfo } from "./contracts";
import { renderTemplate } from "./renderer";
import { getTemplateInfos } from "./templates";
import { hasValidBearerToken } from "./utils/network";

type LocalHttpModule = typeof import("node:http");

function getHttpModule(): LocalHttpModule {
  const requireFn = (window as Window & { require?: (name: string) => unknown }).require;
  if (!requireFn) {
    throw new Error("Node require is unavailable in this Obsidian environment.");
  }

  return (requireFn("node:http") ?? requireFn("http")) as LocalHttpModule;
}

export class LocalApiServer {
  private server: Server | null = null;

  constructor(
    private readonly plugin: Plugin & {
      settings: DynamicPromptSettings;
    }
  ) {}

  async start(): Promise<void> {
    if (!Platform.isDesktopApp || this.server) {
      return;
    }

    const http = getHttpModule();
    this.server = http.createServer((request, response) => {
      void this.handleRequest(request, response);
    });

    await new Promise<void>((resolve, reject) => {
      this.server?.once("error", reject);
      this.server?.listen(this.plugin.settings.apiPort, this.plugin.settings.apiHost, () => {
        this.server?.off("error", reject);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    const currentServer = this.server;
    this.server = null;
    await new Promise<void>((resolve, reject) => {
      currentServer.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  private async handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    response.setHeader("Content-Type", "application/json; charset=utf-8");

    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      response.end();
      return;
    }

    if (!hasValidBearerToken(this.plugin.settings.apiAuthToken, request.headers.authorization)) {
      this.writeJson(response, 401, { success: false, error: "Authentication required" } satisfies ApiFailure);
      return;
    }

    const url = new URL(request.url ?? "/", `http://${this.plugin.settings.apiHost}:${this.plugin.settings.apiPort}`);
    if (request.method === "GET" && url.pathname === "/health") {
      this.writeJson(response, 200, { success: true, data: { status: "ok" } } satisfies ApiSuccess<{ status: string }>);
      return;
    }

    if (request.method === "GET" && url.pathname === "/templates") {
      const templates = getTemplateInfos(this.plugin.app, this.plugin.settings);
      this.writeJson(response, 200, { success: true, data: { templates } } satisfies ApiSuccess<{ templates: TemplateInfo[] }>);
      return;
    }

    if (request.method === "POST" && url.pathname === "/render") {
      try {
        const body = (await this.readBody(request)) as RenderRequestBody;
        const result = await renderTemplate(this.plugin.app, this.plugin.settings, body.templatePath, body.referenceDate, body.inputs);
        this.writeJson(response, 200, { success: true, data: result } satisfies ApiSuccess<RenderResult>);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.writeJson(response, 400, { success: false, error: message } satisfies ApiFailure);
      }
      return;
    }

    this.writeJson(response, 404, { success: false, error: "Not found" } satisfies ApiFailure);
  }

  private async readBody(request: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk));
    }

    if (chunks.length === 0) {
      return {};
    }

    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  }

  private writeJson(response: ServerResponse, statusCode: number, body: ApiFailure | ApiSuccess<unknown>): void {
    response.statusCode = statusCode;
    response.end(JSON.stringify(body));
  }

  notifyStarted(): void {
    new Notice(`Dynamic Prompt API started at http://${this.plugin.settings.apiHost}:${this.plugin.settings.apiPort}`);
  }
}
