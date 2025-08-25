import { ConfigService } from '@nestjs/config';
export interface TaxAssessment {
    id: string;
    propertyId: string;
    assessmentYear: number;
    assessedValue: number;
    marketValue: number;
    landValue: number;
    improvementValue: number;
    assessmentDate: Date;
    effectiveDate: Date;
    assessmentType: 'ANNUAL' | 'REVISION' | 'APPEAL' | 'EXEMPTION';
    status: 'ACTIVE' | 'PENDING' | 'APPEALED' | 'FINALIZED';
    exemptions: TaxExemption[];
    taxRates: TaxRate[];
    totalTaxes: number;
    metadata: Record<string, any>;
}
export interface TaxExemption {
    type: 'HOMESTEAD' | 'SENIOR' | 'DISABILITY' | 'VETERAN' | 'AGRICULTURE' | 'OTHER';
    amount: number;
    percentage: number;
    description: string;
    effectiveDate: Date;
    expirationDate?: Date;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}
export interface TaxRate {
    taxingEntity: string;
    rate: number;
    amount: number;
    description: string;
}
export interface AssessmentSearchParams {
    propertyId?: string;
    address?: string;
    assessmentYear?: number;
    assessmentType?: TaxAssessment['assessmentType'];
    status?: TaxAssessment['status'];
    valueMin?: number;
    valueMax?: number;
    limit?: number;
}
export declare class TaxAssessorService {
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    getAssessment(propertyId: string, year?: number): Promise<TaxAssessment | null>;
    getAssessmentHistory(propertyId: string, years?: number): Promise<TaxAssessment[]>;
    searchAssessments(params: AssessmentSearchParams): Promise<TaxAssessment[]>;
    getTaxRates(jurisdiction: string, year: number): Promise<TaxRate[]>;
    getExemptions(propertyId: string): Promise<TaxExemption[]>;
    calculateTaxes(assessedValue: number, exemptions: TaxExemption[], taxRates: TaxRate[]): Promise<{
        taxableValue: number;
        totalExemptions: number;
        totalTaxes: number;
        breakdown: TaxRate[];
    }>;
    validatePropertyId(propertyId: string): Promise<{
        isValid: boolean;
        normalizedId?: string;
        confidence: number;
    }>;
    private makeApiCall;
}
//# sourceMappingURL=tax-assessor.service.d.ts.map
