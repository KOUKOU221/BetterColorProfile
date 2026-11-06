/**
 * Better Color Profile - Standalone HTTP Server
 * Allows running the API and Admin console locally or on any VPS/Node environment.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { handleApiRequest } = require("./handler");

const PORT = process.env.PORT || 5050;

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = urlObj.pathname;

  // Route API calls
  if (pathname.startsWith("/api/")) {
    return handleApiRequest(req, res);
  }

  // Route Admin site (/admin/*)
  if (pathname.startsWith("/admin")) {
    let relPath = pathname.replace(/^\/admin\/?/, "");
    if (!relPath) relPath = "index.html";
    const adminBase = path.resolve(__dirname, "..", "admin");
    const filePath = path.resolve(adminBase, relPath);

    if (filePath.startsWith(adminBase) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "text/plain" });
      return fs.createReadStream(filePath).pipe(res);
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Admin file not found");
  }

  // Route Public showcase website (web/index.html)
  const webBase = path.resolve(__dirname, "..", "web");
  const relWebPath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const staticPath = path.resolve(webBase, relWebPath);
  if (staticPath.startsWith(webBase) && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    const ext = path.extname(staticPath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "text/plain" });
    return fs.createReadStream(staticPath).pipe(res);
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`[BCP Server] Running on http://localhost:${PORT}`);
  console.log(`[BCP Server] Public Site:  http://localhost:${PORT}/`);
  console.log(`[BCP Server] Admin Console: http://localhost:${PORT}/admin/`);
  console.log(`[BCP Server] API Endpoints: http://localhost:${PORT}/api/`);
});
