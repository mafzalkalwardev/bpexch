import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole, canManageRole } from '@bpexch/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private audit: AuditService,
  ) {}

  async create(actor: { id: string; role: UserRole }, dto: CreateUserDto) {
    if (!canManageRole(actor.role, dto.role)) {
      throw new ForbiddenException(`Cannot create role ${dto.role}`);
    }

    const parentId = dto.parentId || actor.id;
    const parent = await this.prisma.user.findUnique({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent not found');

    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existing) throw new BadRequestException('Username taken');

    const passwordHash = await this.auth.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        role: dto.role,
        parentId,
        locale: dto.locale || 'en',
        phone: dto.phone,
        status: 'ACTIVE',
      },
    });

    await this.rebuildClosure(user.id, parentId);
    await this.prisma.wallet.create({ data: { userId: user.id, balance: 0, currency: 'PKR' } });

    await this.audit.log({
      actorId: actor.id,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: dto.role, parentId },
    });

    return { id: user.id, username: user.username, role: user.role };
  }

  async getDownline(actorId: string, actorRole: UserRole, depth = 1) {
    const closures = await this.prisma.hierarchyClosure.findMany({
      where: {
        ancestorId: actorId,
        depth: { gte: 1, lte: depth === -1 ? undefined : depth },
      },
      include: {
        descendant: { include: { wallet: true } },
      },
    });

    return closures.map((c) => ({
      id: c.descendant.id,
      username: c.descendant.username,
      role: c.descendant.role,
      status: c.descendant.status,
      balance: c.descendant.wallet ? Number(c.descendant.wallet.balance) : 0,
      depth: c.depth,
      parentId: c.descendant.parentId,
      createdAt: c.descendant.createdAt.toISOString(),
    }));
  }

  async getHierarchyTree(rootId: string) {
    const closures = await this.prisma.hierarchyClosure.findMany({
      where: { ancestorId: rootId },
      include: { descendant: { include: { wallet: true } } },
      orderBy: { depth: 'asc' },
    });
    return closures.map((c) => ({
      id: c.descendant.id,
      username: c.descendant.username,
      role: c.descendant.role,
      depth: c.depth,
      balance: c.descendant.wallet ? Number(c.descendant.wallet.balance) : 0,
      parentId: c.descendant.parentId,
    }));
  }

  private async rebuildClosure(userId: string, parentId: string) {
    await this.prisma.hierarchyClosure.create({
      data: { ancestorId: userId, descendantId: userId, depth: 0 },
    });
    const ancestors = await this.prisma.hierarchyClosure.findMany({
      where: { descendantId: parentId },
    });
    for (const a of ancestors) {
      await this.prisma.hierarchyClosure.create({
        data: { ancestorId: a.ancestorId, descendantId: userId, depth: a.depth + 1 },
      });
    }
  }

  async isInDownline(ancestorId: string, descendantId: string): Promise<boolean> {
    const closure = await this.prisma.hierarchyClosure.findUnique({
      where: { ancestorId_descendantId: { ancestorId, descendantId } },
    });
    return !!closure && ancestorId !== descendantId;
  }
}
