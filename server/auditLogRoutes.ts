import type { FastifyInstance } from "fastify";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";

export type AuditLogRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

export function registerAuditLogRoutes(server: FastifyInstance, options: AuditLogRoutesOptions): void {
  const { repository } = options;

  server.get<{ Params: { workspaceId: string } }>("/api/workspaces/:workspaceId/audit-log", async (request) =>
    repository.listAuditLogRecords(request.params.workspaceId)
  );
}
