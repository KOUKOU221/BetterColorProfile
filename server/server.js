/**
 * Better Color Profile - Standalone HTTP Server
 * Allows running the API and Admin console locally or on any VPS/Node environment.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { handleApiRequest } = require("./handler");

const PORT = process.env.PORT || 8085;

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".txt": "text/plain",
};

function serveFileWithRange(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  if (range && range.startsWith("bytes=")) {
    const parts = range.replace(/bytes=/, "").split("-");
    const parsedStart = parseInt(parts[0], 10);
    const parsedEnd = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const start = isNaN(parsedStart) ? 0 : parsedStart;
    const end = isNaN(parsedEnd) ? stat.size - 1 : parsedEnd;

    if (start < 0 || start > end || start >= stat.size || end >= stat.size) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
      return res.end();
    }
    const chunksize = (end - start) + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType
    });
    return fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes"
    });
    return fs.createReadStream(filePath).pipe(res);
  }
}

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
      return serveFileWithRange(req, res, filePath);
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Admin file not found");
  }

  // Route Public showcase website (web/index.html)
  const webBase = path.resolve(__dirname, "..", "web");
  let relWebPath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  if (relWebPath === "web" || relWebPath === "web/") {
    relWebPath = "index.html";
  } else if (relWebPath.startsWith("web/")) {
    relWebPath = relWebPath.slice(4);
  }
  const staticPath = path.resolve(webBase, relWebPath);
  if (staticPath.startsWith(webBase) && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    return serveFileWithRange(req, res, staticPath);
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
