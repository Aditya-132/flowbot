// Vercel serverless entry point.
//
// vercel.json rewrites every request to this function, which is just the
// FlowBot Express app. server.js detects Vercel (process.env.VERCEL is set by
// the platform), skips app.listen(), and creates the DB schema lazily on the
// first request. The built frontend is bundled in via vercel.json → includeFiles
// so the app's own express.static can serve it.
module.exports = require("../backend/server.js");
