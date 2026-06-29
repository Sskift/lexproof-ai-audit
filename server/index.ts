import { buildServer } from "./app.js";
import { createPrismaReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";
const databaseUrl = process.env.DATABASE_URL ?? "file:./review-workspace.db";

createPrismaReviewWorkspaceRepository({ databaseUrl })
  .then((repository) => {
    const server = buildServer({ repository });
    return server.listen({ host, port }).then((address: string) => ({ server, address }));
  })
  .then(({ server, address }) => {
    server.log.info(`LexProof Secure Review Workspace API listening at ${address}`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
