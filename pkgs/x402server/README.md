```txt
npm install
npm run dev
```

```txt
npm run deploy
```

`wrangler deploy` does not read `.dev.vars`. Production/deploy-time values must be
provided via `wrangler.jsonc` (`vars`) or as secrets (`wrangler secret put ...`).

Required payment variables:

- `SERVER_WALLET_ADDRESS`
- `FACILITATOR_URL`
- `X402_PRICE_USD`
- `X402_NETWORK`

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```
