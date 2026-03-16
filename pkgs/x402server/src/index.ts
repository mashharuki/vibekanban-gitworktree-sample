import { createApp } from "./app";

// Cloudflare Workers のエントリーポイント。
const app = createApp();

export { createApp };

export default app;
