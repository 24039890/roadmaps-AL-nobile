// api/health.js
module.exports = function handler(req, res) {
  res
    .status(200)
    .json({
      status: "ok",
      message: "API is working",
      timestamp: new Date().toISOString(),
    });
};
