import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata as object,
        ipAddress: params.ipAddress,
      },
    });
  }

  async findRecent(limit = 50, actorId?: string) {
    return this.prisma.auditLog.findMany({
      where: actorId ? { actorId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { actor: { select: { username: true, role: true } } },
    });
  }
}
