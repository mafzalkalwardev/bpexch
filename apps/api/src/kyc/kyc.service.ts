import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { KycSubmissionDto } from './kyc.dto';

@Injectable()
export class KycService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async submit(userId: string, dto: KycSubmissionDto) {
    const doc = await this.prisma.kycDocument.create({
      data: {
        userId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        documentUrl: dto.documentUrl,
        status: 'PENDING',
      },
    });
    await this.prisma.user.update({ where: { id: userId }, data: { kycStatus: 'PENDING' } });
    await this.audit.log({
      actorId: userId,
      action: 'KYC_SUBMIT',
      entityType: 'KycDocument',
      entityId: doc.id,
    });
    return doc;
  }

  async review(documentId: string, reviewerId: string, approve: boolean, note?: string) {
    const doc = await this.prisma.kycDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    const status = approve ? 'APPROVED' : 'REJECTED';
    await this.prisma.kycDocument.update({
      where: { id: documentId },
      data: { status, reviewedById: reviewerId, reviewNote: note },
    });
    await this.prisma.user.update({ where: { id: doc.userId }, data: { kycStatus: status } });
    return { status };
  }

  async pending() {
    return this.prisma.kycDocument.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { username: true } } },
    });
  }
}
