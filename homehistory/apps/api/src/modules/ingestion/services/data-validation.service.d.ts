export interface ValidationRule {
    field: string;
    type: 'required' | 'email' | 'phone' | 'zipcode' | 'number' | 'date' | 'url' | 'custom';
    message: string;
    customValidator?: (value: any) => boolean;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata?: Record<string, any>;
}
export interface DataSchema {
    [key: string]: ValidationRule[];
}
export declare class DataValidationService {
    private readonly logger;
    private readonly propertySchema;
    private readonly documentSchema;
    private readonly userSchema;
    validateData(data: any, schema: DataSchema): Promise<ValidationResult>;
    validatePropertyData(data: any): Promise<ValidationResult>;
    validateDocumentData(data: any): Promise<ValidationResult>;
    validateUserData(data: any): Promise<ValidationResult>;
    validateBulkData(dataArray: any[], schema: DataSchema): Promise<{
        results: ValidationResult[];
        summary: {
            total: number;
            valid: number;
            invalid: number;
            totalErrors: number;
            totalWarnings: number;
        };
    }>;
    validateDataQuality(data: any, schema: DataSchema): Promise<{
        qualityScore: number;
        completeness: number;
        accuracy: number;
        consistency: number;
        issues: string[];
    }>;
    private validateField;
    private validateCrossFields;
    private calculateConsistency;
    private isValidFileType;
    createCustomSchema(rules: ValidationRule[]): DataSchema;
    extendSchema(baseSchema: DataSchema, additionalRules: ValidationRule[]): DataSchema;
}
//# sourceMappingURL=data-validation.service.d.ts.map
