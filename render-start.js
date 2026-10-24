// render-start.js
// Intercepts Render's default 'yarn' command during the deploy phase.
// In the deploy phase, Render sets the PORT environment variable.
// In the build phase, PORT is not set.

if (process.env.PORT) {
  console.log(`[Render Deploy] Detected PORT=${process.env.PORT}. Starting PART production server...`);
  require('./server.js');
} else {
  console.log('[Render Build] No PORT environment variable. Proceeding with standard build.');
}
