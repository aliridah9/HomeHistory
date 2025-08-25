export declare enum MaintenancePriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare enum MaintenanceStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    ON_HOLD = "on_hold"
}
export declare enum MaintenanceType {
    PREVENTIVE = "preventive",
    CORRECTIVE = "corrective",
    EMERGENCY = "emergency",
    INSPECTION = "inspection"
}
export declare class CreateMaintenanceTaskDto {
    propertyId: string;
    title: string;
    description: string;
    type: MaintenanceType;
    priority?: MaintenancePriority;
    estimatedCost?: number;
    scheduledDate?: string;
    dueDate?: string;
    contractorId?: string;
    notes?: string;
    attachments?: string[];
}
export declare class UpdateMaintenanceTaskDto {
    title?: string;
    description?: string;
    type?: MaintenanceType;
    priority?: MaintenancePriority;
    status?: MaintenanceStatus;
    estimatedCost?: number;
    actualCost?: number;
    scheduledDate?: string;
    dueDate?: string;
    startDate?: string;
    completionDate?: string;
    contractorId?: string;
    notes?: string;
    attachments?: string[];
    completed?: boolean;
}
export declare class MaintenanceTaskResponseDto {
    id: string;
    propertyId: string;
    title: string;
    description: string;
    type: MaintenanceType;
    priority: MaintenancePriority;
    status: MaintenanceStatus;
    estimatedCost?: number;
    actualCost?: number;
    scheduledDate?: Date;
    dueDate?: Date;
    startDate?: Date;
    completionDate?: Date;
    contractorId?: string;
    notes?: string;
    attachments?: string[];
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class MaintenanceTaskQueryDto {
    page?: number;
    limit?: number;
    propertyId?: string;
    status?: MaintenanceStatus;
    type?: MaintenanceType;
    priority?: MaintenancePriority;
    contractorId?: string;
    completed?: boolean;
}
//# sourceMappingURL=maintenance-task.dto.d.ts.map
