import { buildServer } from "./app.js";

const server = buildServer();
const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";

server
  .listen({ host, port })
  .then((address: string) => {
    server.log.info(`LexProof Secure Review Workspace API listening at ${address}`);
  })
  .catch((error: unknown) => {
    server.log.error(error);
    process.exit(1);
  });
