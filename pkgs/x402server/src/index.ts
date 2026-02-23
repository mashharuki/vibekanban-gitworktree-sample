import { createApp } from "./app";

export { client, createResourceServer, resolvePaymentOptions } from "./config";
export { createRoutes } from "./route";

export { createApp };

const app = createApp();

export default app;
