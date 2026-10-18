import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";

export async function startProductionServer() {
  const prefix = "/Smart-home-dashboard/";
  const root = resolve("dist");
  let workerRevision = 0;
  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".webmanifest": "application/manifest+json",
    ".json": "application/json",
  };
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = resolve(root, pathname.slice(prefix.length) || "index.html");
    if (!pathname.startsWith(prefix) || !file.startsWith(root + "/")) {
      res.writeHead(404).end();
      return;
    }
    try {
      let contents = await readFile(file);
      if (pathname === `${prefix}sw.js`)
        contents = Buffer.concat([
          contents,
          Buffer.from(`\n// Offline update test revision: ${workerRevision}\n`),
        ]);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(contents);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    server,
    url: `http://127.0.0.1:${server.address().port}${prefix}`,
    nextWorker: () => {
      workerRevision += 1;
    },
  };
}
