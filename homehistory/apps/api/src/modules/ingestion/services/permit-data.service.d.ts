import { ConfigService } from '@nestjs/config';
export interface BuildingPermit {
    id: string;
    permitNumber: string;
    propertyId: string;
    address: string;
    permitType: 'NEW_CONSTRUCTION' | 'RENOVATION' | 'ADDITION' | 'REPAIR' | 'DEMOLITION' | 'ELECTRICAL' | 'PLUMBING' | 'HVAC' | 'OTHER';
    status: 'APPLIED' | 'APPROVED' | 'ISSUED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
    description: string;
    estimatedCost: number;
    actualCost?: number;
    squareFootage?: number;
    contractor?: string;
    contractorLicense?: string;
    applicantName: string;
    applicantPhone?: string;
    applicantEmail?: string;
    appliedDate: Date;
    approvedDate?: Date;
    issuedDate?: Date;
    startDate?: Date;
    completionDate?: Date;
    expirationDate?: Date;
    inspections: PermitInspection[];
    documents: PermitDocument[];
    metadata: Record<string, any>;
}
export interface PermitInspection {
    id: string;
    permitId: string;
    inspectionType: 'FOOTING' | 'FOUNDATION' | 'FRAMING' | 'ELECTRICAL' | 'PLUMBING' | 'HVAC' | 'INSULATION' | 'DRYWALL' | 'FINAL' | 'OTHER';
    status: 'SCHEDULED' | 'PASSED' | 'FAILED' | 'CANCELLED' | 'REINSPECTION';
    scheduledDate?: Date;
    completedDate?: Date;
    inspector?: string;
    notes?: string;
    result?: 'PASS' | 'FAIL' | 'PARTIAL';
    violations?: string[];
}
export interface PermitDocument {
    id: string;
    permitId: string;
    documentType: 'APPLICATION' | 'PLANS' | 'SPECIFICATIONS' | 'CONTRACTOR_INFO' | 'INSURANCE' | 'INSPECTION_REPORT' | 'CERTIFICATE' | 'OTHER';
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedDate: Date;
    description?: string;
}
export interface PermitSearchParams {
    propertyId?: string;
    address?: string;
    permitType?: BuildingPermit['permitType'];
    status?: BuildingPermit['status'];
    dateFrom?: Date;
    dateTo?: Date;
    costMin?: number;
    costMax?: number;
    contractor?: string;
    limit?: number;
}
export declare class PermitDataService {
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    searchPermits(params: PermitSearchParams): Promise<BuildingPermit[]>;
    getPermitDetails(permitId: string): Promise<BuildingPermit | null>;
    getPermitHistory(propertyId: string, years?: number): Promise<BuildingPermit[]>;
    getActivePermits(propertyId: string): Promise<BuildingPermit[]>;
    getPermitStats(propertyId: string): Promise<{
        totalPermits: number;
        completedPermits: number;
        activePermits: number;
        totalValue: number;
        averageCost: number;
        permitTypes: Record<string, number>;
    }>;
    validatePermitNumber(permitNumber: string): Promise<{
        isValid: boolean;
        normalizedNumber?: string;
        confidence: number;
    }>;
    private makeApiCall;
}
//# sourceMappingURL=permit-data.service.d.ts.map
