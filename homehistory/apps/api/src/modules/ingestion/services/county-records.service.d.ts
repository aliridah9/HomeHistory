import { ConfigService } from '@nestjs/config';
export interface CountyRecord {
    id: string;
    propertyId: string;
    recordType: 'DEED' | 'MORTGAGE' | 'LIEN' | 'TAX' | 'PERMIT' | 'ASSESSMENT';
    documentNumber: string;
    recordingDate: Date;
    effectiveDate?: Date;
    grantor?: string;
    grantee?: string;
    amount?: number;
    description: string;
    book?: string;
    page?: string;
    instrumentNumber?: string;
    status: 'ACTIVE' | 'SATISFIED' | 'CANCELLED' | 'EXPIRED';
    metadata: Record<string, any>;
}
export interface CountySearchParams {
    address?: string;
    propertyId?: string;
    ownerName?: string;
    recordType?: CountyRecord['recordType'];
    dateFrom?: Date;
    dateTo?: Date;
    amountMin?: number;
    amountMax?: number;
    limit?: number;
}
export interface CountyPropertyInfo {
    propertyId: string;
    address: string;
    ownerName: string;
    ownerAddress?: string;
    legalDescription: string;
    lotSize: number;
    zoning: string;
    landUse: string;
    assessedValue: number;
    marketValue: number;
    lastAssessmentDate: Date;
    taxYear: number;
    annualTaxes: number;
    exemptions: string[];
    records: CountyRecord[];
}
export declare class CountyRecordsService {
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    searchRecords(params: CountySearchParams): Promise<CountyRecord[]>;
    getPropertyInfo(propertyId: string): Promise<CountyPropertyInfo | null>;
    getRecordDetails(recordId: string): Promise<CountyRecord | null>;
    getTaxHistory(propertyId: string, years?: number): Promise<{
        year: number;
        assessedValue: number;
        marketValue: number;
        taxes: number;
        exemptions: string[];
    }[]>;
    searchByOwner(ownerName: string): Promise<CountyPropertyInfo[]>;
    validatePropertyId(propertyId: string): Promise<{
        isValid: boolean;
        normalizedId?: string;
        confidence: number;
    }>;
    private makeApiCall;
}
//# sourceMappingURL=county-records.service.d.ts.map
