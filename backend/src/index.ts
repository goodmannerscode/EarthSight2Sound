import { createApp } from "./app";
import { getConfig } from "./config";

const config = getConfig();
const app = createApp();

console.log(`[api] listening on http://localhost:${config.PORT}`);

export default {
  port: config.PORT,
  fetch: app.fetch,
};
