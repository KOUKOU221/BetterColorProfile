/**
 * Vercel Serverless Function Entry Point for Better Color Profile
 * Routes all incoming /api/* requests to the unified API handler.
 */

const { handleApiRequest } = require("../server/handler");

module.exports = async function handler(req, res) {
  try {
    await handleApiRequest(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: "Internal Server Error", message: err.message }));
  }
};
