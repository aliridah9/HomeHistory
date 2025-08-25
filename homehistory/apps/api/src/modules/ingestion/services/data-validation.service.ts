import { Injectable, Logger } from '@nestjs/common';

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

@Injectable()
export class DataValidationService {
  private readonly logger = new Logger(DataValidationService.name);

  // Predefined validation schemas
  private readonly propertySchema: DataSchema = {
    address: [
      { field: 'address', type: 'required', message: 'Address is required' },
      { field: 'address', type: 'custom', message: 'Address must be at least 5 characters', customValidator: (value) => value && value.length >= 5 },
    ],
    city: [
      { field: 'city', type: 'required', message: 'City is required' },
      { field: 'city', type: 'custom', message: 'City must be at least 2 characters', customValidator: (value) => value && value.length >= 2 },
    ],
    state: [
      { field: 'state', type: 'required', message: 'State is required' },
      { field: 'state', type: 'custom', message: 'State must be 2 characters', customValidator: (value) => value && value.length === 2 },
    ],
    zipCode: [
      { field: 'zipCode', type: 'required', message: 'ZIP code is required' },
      { field: 'zipCode', type: 'zipcode', message: 'Invalid ZIP code format' },
    ],
    price: [
      { field: 'price', type: 'number', message: 'Price must be a valid number' },
      { field: 'price', type: 'custom', message: 'Price must be positive', customValidator: (value) => !value || value > 0 },
    ],
    bedrooms: [
      { field: 'bedrooms', type: 'number', message: 'Bedrooms must be a valid number' },
      { field: 'bedrooms', type: 'custom', message: 'Bedrooms must be between 0 and 20', customValidator: (value) => !value || (value >= 0 && value <= 20) },
    ],
    bathrooms: [
      { field: 'bathrooms', type: 'number', message: 'Bathrooms must be a valid number' },
      { field: 'bathrooms', type: 'custom', message: 'Bathrooms must be between 0 and 10', customValidator: (value) => !value || (value >= 0 && value <= 10) },
    ],
  };

  private readonly documentSchema: DataSchema = {
    fileUrl: [
      { field: 'fileUrl', type: 'required', message: 'File URL is required' },
      { field: 'fileUrl', type: 'url', message: 'Invalid file URL format' },
    ],
    type: [
      { field: 'type', type: 'required', message: 'File type is required' },
      { field: 'type', type: 'custom', message: 'Unsupported file type', customValidator: (value) => this.isValidFileType(value) },
    ],
  };

  private readonly userSchema: DataSchema = {
    email: [
      { field: 'email', type: 'required', message: 'Email is required' },
      { field: 'email', type: 'email', message: 'Invalid email format' },
    ],
    phone: [
      { field: 'phone', type: 'phone', message: 'Invalid phone number format' },
    ],
  };

  async validateData(data: any, schema: DataSchema): Promise<ValidationResult> {
    this.logger.log(`Validating data with schema: ${Object.keys(schema).join(', ')}`);

    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, any> = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      for (const rule of rules) {
        const validationResult = this.validateField(value, rule);
        
        if (!validationResult.isValid) {
          errors.push(validationResult.message || `Invalid value for ${field}`);
        } else if (validationResult.warning) {
          warnings.push(validationResult.warning);
        }
      }

      // Store validation metadata
      metadata[field] = {
        value,
        validated: true,
        timestamp: new Date().toISOString(),
      };
    }

    // Additional cross-field validations
    const crossFieldErrors = this.validateCrossFields(data, schema);
    errors.push(...crossFieldErrors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        ...metadata,
        totalFields: Object.keys(schema).length,
        validatedFields: Object.keys(metadata).length,
        validationTimestamp: new Date().toISOString(),
      },
    };
  }

  async validatePropertyData(data: any): Promise<ValidationResult> {
    return this.validateData(data, this.propertySchema);
  }

  async validateDocumentData(data: any): Promise<ValidationResult> {
    return this.validateData(data, this.documentSchema);
  }

  async validateUserData(data: any): Promise<ValidationResult> {
    return this.validateData(data, this.userSchema);
  }

  async validateBulkData(dataArray: any[], schema: DataSchema): Promise<{
    results: ValidationResult[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      totalErrors: number;
      totalWarnings: number;
    };
  }> {
    this.logger.log(`Validating bulk data: ${dataArray.length} items`);

    const results: ValidationResult[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const data of dataArray) {
      const result = await this.validateData(data, schema);
      results.push(result);

      if (result.isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
    }

    return {
      results,
      summary: {
        total: dataArray.length,
        valid: validCount,
        invalid: invalidCount,
        totalErrors,
        totalWarnings,
      },
    };
  }

  async validateDataQuality(data: any, schema: DataSchema): Promise<{
    qualityScore: number;
    completeness: number;
    accuracy: number;
    consistency: number;
    issues: string[];
  }> {
    this.logger.log('Assessing data quality');

    const validation = await this.validateData(data, schema);
    const totalFields = Object.keys(schema).length;
    const populatedFields = Object.keys(data).filter(key => data[key] !== null && data[key] !== undefined).length;

    // Calculate completeness
    const completeness = totalFields > 0 ? (populatedFields / totalFields) * 100 : 0;

    // Calculate accuracy (inverse of error rate)
    const accuracy = validation.errors.length > 0 ? Math.max(0, 100 - (validation.errors.length * 10)) : 100;

    // Calculate consistency (check for data format consistency)
    const consistency = this.calculateConsistency(data, schema);

    // Calculate overall quality score
    const qualityScore = (completeness + accuracy + consistency) / 3;

    return {
      qualityScore: Math.round(qualityScore * 100) / 100,
      completeness: Math.round(completeness * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      issues: validation.errors,
    };
  }

  private validateField(value: any, rule: ValidationRule): { isValid: boolean; message?: string; warning?: string } {
    // Required validation
    if (rule.type === 'required') {
      if (value === null || value === undefined || value === '') {
        return { isValid: false, message: rule.message };
      }
    }

    // Skip other validations if value is empty (unless required)
    if (value === null || value === undefined || value === '') {
      return { isValid: true };
    }

    // Email validation
    if (rule.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { isValid: false, message: rule.message };
      }
    }

    // Phone validation
    if (rule.type === 'phone') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return { isValid: false, message: rule.message };
      }
    }

    // ZIP code validation
    if (rule.type === 'zipcode') {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(value)) {
        return { isValid: false, message: rule.message };
      }
    }

    // Number validation
    if (rule.type === 'number') {
      if (isNaN(Number(value))) {
        return { isValid: false, message: rule.message };
      }
    }

    // Date validation
    if (rule.type === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { isValid: false, message: rule.message };
      }
    }

    // URL validation
    if (rule.type === 'url') {
      try {
        new URL(value);
      } catch {
        return { isValid: false, message: rule.message };
      }
    }

    // Custom validation
    if (rule.type === 'custom' && rule.customValidator) {
      if (!rule.customValidator(value)) {
        return { isValid: false, message: rule.message };
      }
    }

    return { isValid: true };
  }

  private validateCrossFields(data: any, schema: DataSchema): string[] {
    const errors: string[] = [];

    // Example cross-field validation: if property has bedrooms, it should have bathrooms
    if (data.bedrooms && data.bedrooms > 0 && (!data.bathrooms || data.bathrooms === 0)) {
      errors.push('Property with bedrooms should have at least one bathroom');
    }

    // Example: if price is provided, it should be reasonable for the property type
    if (data.price && data.price > 0) {
      if (data.propertyType === 'SINGLE_FAMILY' && data.price < 50000) {
        errors.push('Price seems too low for a single-family home');
      }
    }

    return errors;
  }

  private calculateConsistency(data: any, schema: DataSchema): number {
    let consistencyScore = 100;
    const issues: string[] = [];

    // Check data type consistency
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      if (value !== null && value !== undefined) {
        const numberRules = rules.filter(rule => rule.type === 'number');
        if (numberRules.length > 0 && typeof value !== 'number') {
          consistencyScore -= 10;
          issues.push(`${field} should be a number`);
        }
      }
    }

    // Check format consistency
    if (data.zipCode && typeof data.zipCode === 'string') {
      const zipFormats = data.zipCode.match(/\d{5}(-\d{4})?/g);
      if (zipFormats && zipFormats.length > 1) {
        consistencyScore -= 5;
        issues.push('Inconsistent ZIP code formats');
      }
    }

    return Math.max(0, consistencyScore);
  }

  private isValidFileType(fileType: string): boolean {
    const supportedTypes = [
      'pdf', 'doc', 'docx', 'txt', 'rtf',
      'jpg', 'jpeg', 'png', 'gif', 'bmp',
      'csv', 'xls', 'xlsx', 'json', 'xml',
    ];
    return supportedTypes.includes(fileType.toLowerCase());
  }

  // Method to create custom validation schema
  createCustomSchema(rules: ValidationRule[]): DataSchema {
    const schema: DataSchema = {};
    
    for (const rule of rules) {
      if (!schema[rule.field]) {
        schema[rule.field] = [];
      }
      schema[rule.field].push(rule);
    }

    return schema;
  }

  // Method to add validation rules to existing schema
  extendSchema(baseSchema: DataSchema, additionalRules: ValidationRule[]): DataSchema {
    const extendedSchema = { ...baseSchema };

    for (const rule of additionalRules) {
      if (!extendedSchema[rule.field]) {
        extendedSchema[rule.field] = [];
      }
      extendedSchema[rule.field].push(rule);
    }

    return extendedSchema;
  }
}
