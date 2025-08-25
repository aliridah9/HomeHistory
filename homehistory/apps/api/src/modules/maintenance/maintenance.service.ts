import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MaintenanceSchedulerService } from './services/maintenance-scheduler.service';
import { 
    CreateMaintenanceTaskDto,
  UpdateMaintenanceTaskDto,
  MaintenanceTaskQueryDto,
  MaintenanceTaskResponseDto 
} from './dto';

@Injectable()
export class MaintenanceService {
  constructor(
    private prisma: PrismaService,
    private schedulerService: MaintenanceSchedulerService,
  ) {}

  async createMaintenance(userId: string, dto: CreateMaintenanceTaskDto): Promise<MaintenanceTaskResponseDto> {
    // Verify property ownership
    await this.verifyPropertyAccess(dto.propertyId, userId);

    // Create maintenance record
    const maintenance = await this.prisma.$queryRaw`
      INSERT INTO maintenance_records (
        id, property_id, title, description, maintenance_type, priority,
        status, scheduled_date, estimated_cost, recurring_frequency,
        created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${dto.propertyId}, ${dto.title}, ${dto.description},
        ${dto.type}, ${dto.priority || 'MEDIUM'}, 'PENDING',
        ${dto.scheduledDate}, ${dto.estimatedCost || 0}, null,
        ${userId}, NOW(), NOW()
      ) RETURNING *
    `;

    const record = Array.isArray(maintenance) ? maintenance[0] : maintenance;

    // Schedule recurring maintenance if specified
    // if (dto.recurringFrequency) {
    //   await this.schedulerService.scheduleRecurringMaintenance(record.id, dto.recurringFrequency);
    // }

    // Log creation
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'maintenance_created',
        entityType: 'maintenance',
        entityId: record.id,
        metadata: {
          propertyId: dto.propertyId,
          maintenanceType: dto.type,
          priority: dto.priority,
        },
      },
    });

    return this.formatMaintenanceResponse(record);
  }

  async getMaintenance(userId: string, query: MaintenanceTaskQueryDto) {
    const { 
      page = 1, 
      limit = 20, 
      propertyId, 
      status, 
      type,
      priority,
      // dateFrom,
      // dateTo,
      // sortBy = 'scheduledDate',
      // sortOrder = 'asc' 
    } = query;

    const skip = (page - 1) * limit;
    
    // Build WHERE clause
    const whereConditions = [`mr.created_by = '${userId}'`];
    
    if (propertyId) whereConditions.push(`mr.property_id = '${propertyId}'`);
    if (status) whereConditions.push(`mr.status = '${status}'`);
    if (type) whereConditions.push(`mr.maintenance_type = '${type}'`);
    if (priority) whereConditions.push(`mr.priority = '${priority}'`);
    // if (dateFrom) whereConditions.push(`mr.scheduled_date >= '${dateFrom}'`);
    // if (dateTo) whereConditions.push(`mr.scheduled_date >= '${dateTo}'`);

    const whereClause = whereConditions.join(' AND ');

    const [records, total] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT mr.*, p.address, p.city, p.state
        FROM maintenance_records mr
        JOIN properties p ON mr.property_id = p.id
        WHERE ${whereClause}
        ORDER BY mr.scheduled_date ASC
        LIMIT ${limit} OFFSET ${skip}
      `,
      this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM maintenance_records mr
        WHERE ${whereClause}
      `
    ]);

    return {
      maintenance: (records as any[]).map(r => this.formatMaintenanceResponse(r)),
      pagination: {
        page,
        limit,
        total: (total as any)[0].count,
        totalPages: Math.ceil((total as any)[0].count / limit),
      },
    };
  }

  async getMaintenanceById(userId: string, maintenanceId: string): Promise<MaintenanceTaskResponseDto> {
    const record = await this.prisma.$queryRaw`
      SELECT mr.*, p.address, p.city, p.state
      FROM maintenance_records mr
      JOIN properties p ON mr.property_id = p.id
      WHERE mr.id = ${maintenanceId} AND mr.created_by = ${userId}
    `;

    if (!Array.isArray(record) || record.length === 0) {
      throw new NotFoundException('Maintenance record not found');
    }

    return this.formatMaintenanceResponse(record[0]);
  }

  async updateMaintenance(userId: string, maintenanceId: string, dto: UpdateMaintenanceTaskDto): Promise<MaintenanceTaskResponseDto> {
    // Verify ownership
    await this.getMaintenanceById(userId, maintenanceId);

    // Build update fields
    const updateFields = [];
    if (dto.title) updateFields.push(`title = '${dto.title}'`);
    if (dto.description) updateFields.push(`description = '${dto.description}'`);
    if (dto.type) updateFields.push(`maintenance_type = '${dto.type}'`);
    if (dto.priority) updateFields.push(`priority = '${dto.priority}'`);
    if (dto.status) updateFields.push(`status = '${dto.status}'`);
    if (dto.scheduledDate) updateFields.push(`scheduled_date = '${dto.scheduledDate}'`);
    if (dto.estimatedCost !== undefined) updateFields.push(`estimated_cost = ${dto.estimatedCost}`);
    if (dto.actualCost !== undefined) updateFields.push(`actual_cost = ${dto.actualCost}`);
    if (dto.completed) updateFields.push(`completed = ${dto.completed}`);
    if (dto.notes) updateFields.push(`notes = '${dto.notes}'`);
    
    updateFields.push(`updated_at = NOW()`);

    const updated = await this.prisma.$queryRaw`
      UPDATE maintenance_records 
      SET ${updateFields.join(', ')}
      WHERE id = ${maintenanceId}
      RETURNING *
    `;

    const record = Array.isArray(updated) ? updated[0] : updated;

    // Log update
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'maintenance_updated',
        entityType: 'maintenance',
        entityId: maintenanceId,
        metadata: { changes: dto } as any,
      },
    });

    return this.formatMaintenanceResponse(record);
  }

  async deleteMaintenance(userId: string, maintenanceId: string): Promise<void> {
    // Verify ownership
    await this.getMaintenanceById(userId, maintenanceId);

    await this.prisma.$queryRaw`
      DELETE FROM maintenance_records WHERE id = ${maintenanceId}
    `;

    // Log deletion
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'maintenance_deleted',
        entityType: 'maintenance',
        entityId: maintenanceId,
        metadata: { deletedAt: new Date() },
      },
    });
  }

  async getMaintenanceStats(userId: string): Promise<any> {
    const stats = await this.prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as scheduled,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'OVERDUE' THEN 1 END) as overdue,
        COUNT(CASE WHEN scheduled_date < NOW() AND status != 'COMPLETED' THEN 1 END) as upcoming_overdue,
        AVG(actual_cost) as avg_cost,
        SUM(actual_cost) as total_spent
      FROM maintenance_records mr
      JOIN properties p ON mr.property_id = p.id
      WHERE p.user_id = ${userId}
    `;

    const result = (stats as any)[0];

    return {
      totalRecords: parseInt(result.total_records),
      scheduled: parseInt(result.scheduled),
      inProgress: parseInt(result.in_progress),
      completed: parseInt(result.completed),
      overdue: parseInt(result.overdue),
      upcomingOverdue: parseInt(result.upcoming_overdue),
      averageCost: parseFloat(result.avg_cost) || 0,
      totalSpent: parseFloat(result.total_spent) || 0,
    };
  }

  async getUpcomingMaintenance(userId: string) {
    const upcoming = await this.prisma.$queryRaw`
      SELECT mr.*, p.address, p.city, p.state
      FROM maintenance_records mr
      JOIN properties p ON mr.property_id = p.id
      WHERE p.user_id = ${userId}
        AND mr.status IN ('SCHEDULED', 'IN_PROGRESS')
        AND mr.scheduled_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
      ORDER BY mr.scheduled_date ASC
      LIMIT 20
    `;

    return {
      upcoming: (upcoming as any[]).map(r => this.formatMaintenanceResponse(r)),
    };
  }

  async getOverdueMaintenance(userId: string) {
    const overdue = await this.prisma.$queryRaw`
      SELECT mr.*, p.address, p.city, p.state
      FROM maintenance_records mr
      JOIN properties p ON mr.property_id = p.id
      WHERE p.user_id = ${userId}
        AND mr.status != 'COMPLETED'
        AND mr.scheduled_date < NOW()
      ORDER BY mr.scheduled_date ASC
    `;

    return {
      overdue: (overdue as any[]).map(r => this.formatMaintenanceResponse(r)),
    };
  }

  async completeMaintenance(userId: string, maintenanceId: string, data: any) {
    await this.updateMaintenance(userId, maintenanceId, {
      status: 'COMPLETED' as any,
      completionDate: new Date().toISOString() as any,
      actualCost: data.cost,
      notes: data.notes,
    });

    // Log completion
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'maintenance_completed',
        entityType: 'maintenance',
        entityId: maintenanceId,
        metadata: {
          completedBy: data.completedBy,
          cost: data.cost,
          notes: data.notes,
        },
      },
    });

    return { success: true, message: 'Maintenance marked as completed' };
  }

  async scheduleMaintenance(userId: string, maintenanceId: string, data: any) {
    await this.updateMaintenance(userId, maintenanceId, {
      scheduledDate: data.scheduledDate,
      status: 'PENDING' as any,
      notes: data.notes,
    });

    return { success: true, message: 'Maintenance scheduled successfully' };
  }

  async getPropertyMaintenance(userId: string, propertyId: string, query: MaintenanceTaskQueryDto) {
    await this.verifyPropertyAccess(propertyId, userId);
    return this.getMaintenance(userId, { ...query, propertyId });
  }

  async bulkScheduleMaintenance(userId: string, data: any) {
    const { propertyIds, maintenanceType, frequency, startDate } = data;

    // Verify all properties belong to user
    for (const propertyId of propertyIds) {
      await this.verifyPropertyAccess(propertyId, userId);
    }

    const scheduled = [];
    for (const propertyId of propertyIds) {
      const maintenance = await this.createMaintenance(userId, {
        propertyId,
        title: `${maintenanceType} - Scheduled`,
        description: `Recurring ${maintenanceType} maintenance`,
        type: maintenanceType,
        scheduledDate: startDate,
        // DTO may not include this; kept for response payload matching
        // @ts-expect-error
        recurringFrequency: frequency as any,
        priority: 'MEDIUM' as any,
      });
      scheduled.push(maintenance);
    }

    return {
      scheduled: scheduled.length,
      maintenanceRecords: scheduled,
    };
  }

  private async verifyPropertyAccess(propertyId: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.userId !== userId) {
      throw new NotFoundException('Property not found');
    }
  }

  private formatMaintenanceResponse(record: any): MaintenanceTaskResponseDto {
    return {
      id: record.id,
      propertyId: record.property_id,
      title: record.title,
      description: record.description,
      type: record.maintenance_type,
      priority: record.priority,
      status: record.status,
      scheduledDate: record.scheduled_date,
      // @ts-expect-error DTO may omit this field
      completedDate: record.completed_date as any,
      estimatedCost: record.estimated_cost,
      actualCost: record.actual_cost,
      notes: record.notes,
      recurringFrequency: record.recurring_frequency,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      property: record.address ? {
        address: record.address,
        city: record.city,
        state: record.state,
      } : undefined,
    };
  }
}
