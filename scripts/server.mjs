import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const distRoot = path.join(siteRoot, "dist");
const serveRoot = process.env.SERVE_ROOT
  ? path.resolve(process.env.SERVE_ROOT)
  : fs.existsSync(path.join(distRoot, "index.html"))
    ? distRoot
    : siteRoot;
const startPort = Number(process.env.PORT || 5173);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"],
]);

function resolveRequestPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = decoded === "/" ? "/index.html" : decoded;
  const resolved = path.resolve(serveRoot, `.${cleanPath}`);
  if (resolved !== serveRoot && !resolved.startsWith(`${serveRoot}${path.sep}`)) return null;
  return resolved;
}

function createServer() {
  return http.createServer((request, response) => {
    const requestPath = resolveRequestPath(request.url || "/");
    if (!requestPath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const filePath = fs.existsSync(requestPath) && fs.statSync(requestPath).isFile()
      ? requestPath
      : path.join(serveRoot, "index.html");

    fs.readFile(filePath, (error, content) => {
      if (error) {
        response.writeHead(500);
        response.end("Server error");
        return;
      }

      const type = mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
      response.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": "no-store",
      });
      response.end(content);
    });
  });
}

function listen(port) {
  const server = createServer();
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      listen(port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`学科地图网站已启动：http://127.0.0.1:${port}`);
  });
}

listen(startPort);
