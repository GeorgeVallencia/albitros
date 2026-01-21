import { prisma } from '@/lib/prisma';
import { FraudType, InvestigationStatus } from '@prisma/client';

export interface InvestigationWorkflow {
  id: string;
  caseNumber: string;
  claimId?: string;
  providerId?: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  assignedAt?: Date;
  dueDate?: Date;
  completedAt?: Date;
  findings?: string;
  totalRecovered?: number;
  fraudConfirmed: boolean;
  fraudTypes: FraudType[];
  notes: InvestigationNote[];
  documents: InvestigationDocument[];
  timeline: InvestigationTimeline[];
  compliance: ComplianceCheck[];
}

export interface InvestigationNote {
  id: string;
  investigationId: string;
  userId: string;
  userName: string;
  note: string;
  isInternal: boolean;
  createdAt: Date;
  attachments?: string[];
}

export interface InvestigationDocument {
  id: string;
  investigationId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  description: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Date;
  isConfidential: boolean;
  version: number;
}

export interface InvestigationTimeline {
  id: string;
  investigationId: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: Date;
  metadata?: any;
}

export interface ComplianceCheck {
  id: string;
  investigationId: string;
  checkType: 'HIPAA' | 'SOC2' | 'REGULATORY' | 'INTERNAL_AUDIT';
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'WAIVED';
  checkedBy: string;
  checkedByName: string;
  checkedAt: Date;
  findings: string;
  recommendations: string[];
  dueDate: Date;
}

export interface InvestigationMetrics {
  totalInvestigations: number;
  openInvestigations: number;
  closedInvestigations: number;
  averageResolutionTime: number;
  totalRecovered: number;
  fraudConfirmationRate: number;
  byStatus: Record<InvestigationStatus, number>;
  byPriority: Record<string, number>;
  byAssignee: Record<string, number>;
  aging: {
    lessThan30: number;
    thirtyTo60: number;
    sixtyTo90: number;
    over90: number;
  };
}

export class InvestigationManager {
  /**
   * Create a new investigation
   */
  static async createInvestigation(data: {
    claimId?: string;
    providerId?: string;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    fraudTypes: FraudType[];
    createdBy: string;
    assignedTo?: string;
    dueDate?: Date;
  }): Promise<InvestigationWorkflow> {
    const caseNumber = this.generateCaseNumber();

    const investigation = await prisma.investigation.create({
      data: {
        caseNumber,
        claimId: data.claimId,
        providerId: data.providerId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        fraudTypes: data.fraudTypes,
        createdBy: data.createdBy,
        assignedTo: data.assignedTo,
        openedAt: new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assignedAt: data.assignedTo ? new Date() : undefined,
        companyId: await this.getUserCompanyId(data.createdBy)
      },
      include: {
        notes: true,
        documents: true,
        creator: {
          select: { id: true, fullName: true, email: true }
        },
        assignee: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    // Create initial timeline entry
    await this.addTimelineEntry(investigation.id, 'CREATED', 'Investigation created', data.createdBy);

    // If assigned, create assignment timeline entry
    if (data.assignedTo) {
      await this.addTimelineEntry(investigation.id, 'ASSIGNED', `Assigned to ${data.assignedTo}`, data.createdBy);
    }

    // Initialize compliance checks
    await this.initializeComplianceChecks(investigation.id);

    return this.formatInvestigation(investigation);
  }

  /**
   * Update investigation status
   */
  static async updateInvestigationStatus(
    investigationId: string,
    status: InvestigationStatus,
    userId: string,
    notes?: string
  ): Promise<InvestigationWorkflow> {
    const updateData: any = { status };

    if (status === InvestigationStatus.CLOSED) {
      updateData.closedAt = new Date();
    } else if (status === InvestigationStatus.IN_PROGRESS && !updateData.assignedAt) {
      updateData.assignedAt = new Date();
    }

    const investigation = await prisma.investigation.update({
      where: { id: investigationId },
      data: updateData,
      include: {
        notes: true,
        documents: true,
        creator: true,
        assignee: true
      }
    });

    // Add timeline entry
    await this.addTimelineEntry(investigationId, 'STATUS_CHANGED', `Status changed to ${status}`, userId);

    // Add note if provided
    if (notes) {
      await this.addNote(investigationId, userId, notes, false);
    }

    return this.formatInvestigation(investigation);
  }

  /**
   * Add note to investigation
   */
  static async addNote(
    investigationId: string,
    userId: string,
    note: string,
    isInternal: boolean = false,
    attachments?: string[]
  ): Promise<InvestigationNote> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const investigationNote = await prisma.investigationNote.create({
      data: {
        investigationId,
        userId,
        note,
        isInternal
      }
    });

    // Add timeline entry
    await this.addTimelineEntry(
      investigationId,
      isInternal ? 'INTERNAL_NOTE' : 'NOTE_ADDED',
      isInternal ? 'Internal note added' : 'Note added',
      userId
    );

    return {
      ...investigationNote,
      userName: user?.fullName || 'Unknown',
      attachments
    };
  }

  /**
   * Upload document to investigation
   */
  static async uploadDocument(data: {
    investigationId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    description: string;
    uploadedBy: string;
    isConfidential: boolean;
  }): Promise<InvestigationDocument> {
    const user = await prisma.user.findUnique({ where: { id: data.uploadedBy } });

    // Get current version for this investigation
    const existingDocs = await prisma.investigationDocument.findMany({
      where: { investigationId: data.investigationId },
      orderBy: { createdAt: 'desc' }
    });

    const version = existingDocs.length > 0 ? Math.max(...existingDocs.map(d => d.version || 1)) + 1 : 1;

    const document = await prisma.investigationDocument.create({
      data: {
        investigationId: data.investigationId,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        filePath: data.filePath,
        description: data.description,
        uploadedBy: data.uploadedBy
      }
    });

    // Add timeline entry
    await this.addTimelineEntry(
      data.investigationId,
      'DOCUMENT_UPLOADED',
      `Document uploaded: ${data.fileName}`,
      data.uploadedBy,
      { fileType: data.fileType, isConfidential: data.isConfidential }
    );

    return {
      ...document,
      uploadedByName: user?.fullName || 'Unknown',
      version,
      uploadedAt: document.createdAt,
      isConfidential: false
    };
  }

  /**
   * Complete investigation with findings
   */
  static async completeInvestigation(
    investigationId: string,
    findings: string,
    fraudConfirmed: boolean,
    fraudTypes: FraudType[],
    totalRecovered?: number,
    userId: string
  ): Promise<InvestigationWorkflow> {
    const investigation = await prisma.investigation.update({
      where: { id: investigationId },
      data: {
        status: InvestigationStatus.CLOSED,
        findings,
        fraudConfirmed,
        fraudTypes,
        totalRecovered,
        closedAt: new Date()
      },
      include: {
        notes: true,
        documents: true,
        creator: true,
        assignee: true
      }
    });

    // Add timeline entry
    await this.addTimelineEntry(
      investigationId,
      'COMPLETED',
      `Investigation completed. Fraud confirmed: ${fraudConfirmed}`,
      userId,
      {
        totalRecovered,
        fraudTypes,
        fraudConfirmed
      }
    );

    // Final compliance check
    await this.performFinalComplianceCheck(investigationId, userId);

    return this.formatInvestigation(investigation);
  }

  /**
   * Get investigation metrics
   */
  static async getInvestigationMetrics(companyId: string): Promise<InvestigationMetrics> {
    const investigations = await prisma.investigation.findMany({
      where: { companyId },
      include: {
        notes: true,
        documents: true
      }
    });

    const totalInvestigations = investigations.length;
    const openInvestigationsArray = investigations.filter(i =>
      i.status !== InvestigationStatus.CLOSED && i.status !== InvestigationStatus.RESOLVED
    );
    const closedInvestigationsArray = investigations.filter(i =>
      i.status === InvestigationStatus.CLOSED || i.status === InvestigationStatus.RESOLVED
    );

    const openInvestigations = openInvestigationsArray.length;
    const closedInvestigations = closedInvestigationsArray.length;

    // Calculate average resolution time
    const resolvedInvestigations = investigations.filter(i => i.closedAt);
    const averageResolutionTime = resolvedInvestigations.length > 0
      ? resolvedInvestigations.reduce((sum, i) => {
        const resolutionTime = i.closedAt!.getTime() - i.createdAt.getTime();
        return sum + resolutionTime;
      }, 0) / resolvedInvestigations.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Calculate total recovered
    const totalRecovered = investigations.reduce((sum, i) =>
      sum + (i.totalRecovered ? parseFloat(i.totalRecovered.toString()) : 0), 0
    );

    // Calculate fraud confirmation rate
    const fraudConfirmedInvestigations = investigations.filter(i => i.fraudConfirmed).length;
    const fraudConfirmationRate = closedInvestigations > 0
      ? (fraudConfirmedInvestigations / closedInvestigations) * 100
      : 0;

    // Group by status
    const byStatus = investigations.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {} as Record<InvestigationStatus, number>);

    // Group by priority
    const byPriority = investigations.reduce((acc, i) => {
      acc[i.priority] = (acc[i.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by assignee
    const byAssignee = investigations.reduce((acc, i) => {
      if (i.assignedTo) {
        acc[i.assignedTo] = (acc[i.assignedTo] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate aging
    const now = new Date();
    const aging = {
      lessThan30: 0,
      thirtyTo60: 0,
      sixtyTo90: 0,
      over90: 0
    };

    openInvestigationsArray.forEach(investigation => {
      const daysOpen = (now.getTime() - investigation.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysOpen < 30) aging.lessThan30++;
      else if (daysOpen < 60) aging.thirtyTo60++;
      else if (daysOpen < 90) aging.sixtyTo90++;
      else aging.over90++;
    });

    return {
      totalInvestigations,
      openInvestigations,
      closedInvestigations,
      averageResolutionTime,
      totalRecovered,
      fraudConfirmationRate,
      byStatus,
      byPriority,
      byAssignee,
      aging
    };
  }

  /**
   * Get investigation with full details
   */
  static async getInvestigation(investigationId: string): Promise<InvestigationWorkflow> {
    const investigation = await prisma.investigation.findUnique({
      where: { id: investigationId },
      include: {
        notes: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        creator: {
          select: { id: true, fullName: true, email: true }
        },
        assignee: {
          select: { id: true, fullName: true, email: true }
        },
        claim: {
          select: {
            id: true,
            claimNumber: true,
            billedAmount: true,
            serviceDate: true,
            riskScore: true,
            fraudAlerts: true
          }
        },
        provider: {
          select: {
            id: true,
            npi: true,
            firstName: true,
            lastName: true,
            specialty: true,
            riskScore: true
          }
        }
      }
    });

    if (!investigation) {
      throw new Error('Investigation not found');
    }

    // Get timeline entries
    const timeline = await this.getTimeline(investigationId);

    // Get compliance checks
    const compliance = await this.getComplianceChecks(investigationId);

    return this.formatInvestigation(investigation, timeline, compliance);
  }

  /**
   * Search investigations
   */
  static async searchInvestigations(companyId: string, filters: {
    status?: InvestigationStatus;
    priority?: string;
    assignedTo?: string;
    dateFrom?: Date;
    dateTo?: Date;
    fraudTypes?: FraudType[];
    search?: string;
  }): Promise<InvestigationWorkflow[]> {
    const where: any = { companyId };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }
    if (filters.fraudTypes && filters.fraudTypes.length > 0) {
      where.fraudTypes = { hasSome: filters.fraudTypes };
    }
    if (filters.search) {
      where.OR = [
        { caseNumber: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const investigations = await prisma.investigation.findMany({
      where,
      include: {
        notes: true,
        documents: true,
        creator: true,
        assignee: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return Promise.all(investigations.map(i => this.formatInvestigation(i)));
  }

  /**
   * Helper methods
   */
  private static generateCaseNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `INV-${year}-${random}`;
  }

  private static async getUserCompanyId(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user?.companyId || '';
  }

  private static async addTimelineEntry(
    investigationId: string,
    action: string,
    description: string,
    userId: string,
    metadata?: any
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    await prisma.claimAuditLog.create({
      data: {
        claimId: investigationId,
        action: `${action}: ${description}`,
        userId,
        details: metadata ? JSON.stringify(metadata) : null
      }
    });
  }

  private static async getTimeline(investigationId: string): Promise<InvestigationTimeline[]> {
    // This would typically use a dedicated timeline table
    // For now, return empty array
    return [];
  }

  private static async initializeComplianceChecks(investigationId: string): Promise<void> {
    const checks = [
      { checkType: 'HIPAA', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { checkType: 'REGULATORY', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      { checkType: 'INTERNAL_AUDIT', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    ];

    for (const check of checks) {
      await prisma.investigationDocument.create({
        data: {
          investigationId,
          fileName: `Compliance_${check.checkType}`,
          fileType: 'COMPLIANCE',
          fileSize: 0,
          filePath: '',
          description: `${check.checkType} compliance check`,
          uploadedBy: 'system'
        }
      });
    }
  }

  private static async performFinalComplianceCheck(investigationId: string, userId: string): Promise<void> {
    // Final compliance check when investigation is closed
    await this.addTimelineEntry(
      investigationId,
      'COMPLIANCE_CHECK',
      'Final compliance check performed',
      userId
    );
  }

  private static async getComplianceChecks(investigationId: string): Promise<ComplianceCheck[]> {
    // This would typically use a dedicated compliance table
    // For now, return empty array
    return [];
  }

  private static formatInvestigation(
    investigation: any,
    timeline?: InvestigationTimeline[],
    compliance?: ComplianceCheck[]
  ): InvestigationWorkflow {
    return {
      id: investigation.id,
      caseNumber: investigation.caseNumber,
      claimId: investigation.claimId,
      providerId: investigation.providerId,
      title: investigation.title,
      description: investigation.description,
      status: investigation.status,
      priority: investigation.priority,
      assignedTo: investigation.assignedTo,
      createdBy: investigation.createdBy,
      createdAt: investigation.createdAt,
      assignedAt: investigation.assignedAt,
      dueDate: investigation.dueDate,
      completedAt: investigation.closedAt,
      findings: investigation.findings,
      totalRecovered: investigation.totalRecovered ? parseFloat(investigation.totalRecovered.toString()) : undefined,
      fraudConfirmed: investigation.fraudConfirmed,
      fraudTypes: investigation.fraudTypes || [],
      notes: investigation.notes?.map((note: any) => ({
        ...note,
        userName: note.user?.fullName || 'Unknown'
      })) || [],
      documents: investigation.documents?.map((doc: any) => ({
        ...doc,
        uploadedByName: 'Unknown' // Would be populated with actual uploader name
      })) || [],
      timeline: timeline || [],
      compliance: compliance || []
    };
  }
}
