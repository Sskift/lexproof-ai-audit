import type { FastifyInstance } from "fastify";
import { createAuditLogExport } from "../src/lib/auditLogExport.js";
import { filterAuditLogRecords, normalizeAuditLogFilters } from "../src/lib/auditLogFilters.js";
import { redactAuditLogRecord } from "../src/lib/auditLogRedaction.js";
import { createApiErrorResponse } from "./apiError.js";
import type { ReviewWorkspaceRepository } from "./reviewWorkspaceRepository.js";

export type AuditLogRoutesOptions = {
  repository: ReviewWorkspaceRepository;
};

export function registerAuditLogRoutes(server: FastifyInstance, options: AuditLogRoutesOptions): void {
  const { repository } = options;

  server.get<{ Params: { workspaceId: string }; Querystring: AuditLogQuery }>(
    "/api/workspaces/:workspaceId/audit-log",
    async (request, reply) => {
      const validation = normalizeAuditLogFilters(request.query);

      if (!validation.valid) {
        return reply.status(400).send(
          createApiErrorResponse({
            error: new Error(validation.errors.join(" ")),
            code: "AUDIT_LOG_FILTER_FAILED",
            fallbackMessage: "Audit Log filter lookup failed.",
            recoveryAction: "Use supported audit log filters for actorId, action, targetType, or targetId."
          })
        );
      }

      const records = await repository.listAuditLogRecords(request.params.workspaceId);
      return filterAuditLogRecords(records, validation.filters).map(redactAuditLogRecord);
    }
  );

  server.get<{ Params: { workspaceId: string }; Querystring: AuditLogQuery }>(
    "/api/workspaces/:workspaceId/audit-log/export",
    async (request, reply) => {
      const validation = normalizeAuditLogFilters(request.query);

      if (!validation.valid) {
        return reply.status(400).send(
          createApiErrorResponse({
            error: new Error(validation.errors.join(" ")),
            code: "AUDIT_LOG_EXPORT_FAILED",
            fallbackMessage: "Audit Log export lookup failed.",
            recoveryAction: "Use supported audit log filters before exporting audit-log metadata."
          })
        );
      }

      const records = await repository.listAuditLogRecords(request.params.workspaceId);
      return createAuditLogExport({
        workspaceId: request.params.workspaceId,
        records: filterAuditLogRecords(records, validation.filters)
      });
    }
  );
}

type AuditLogQuery = {
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
};
