import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class TaxAssessorService {
  private readonly logger = new Logger(TaxAssessorService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.tax-assessor.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TAX_ASSESSOR_API_KEY') || '';
  }

  async getAssessment(propertyId: string, year?: number): Promise<TaxAssessment | null> {
    try {
      const assessmentYear = year || new Date().getFullYear();
      this.logger.log(`Fetching tax assessment for property ID: ${propertyId}, year: ${assessmentYear}`);

      // Mock implementation - simulate API call
      const mockAssessment: TaxAssessment = {
        id: `assessment-${propertyId}-${assessmentYear}`,
        propertyId,
        assessmentYear,
        assessedValue: 425000,
        marketValue: 450000,
        landValue: 150000,
        improvementValue: 275000,
        assessmentDate: new Date(`${assessmentYear}-01-01`),
        effectiveDate: new Date(`${assessmentYear}-01-01`),
        assessmentType: 'ANNUAL',
        status: 'ACTIVE',
        exemptions: [
          {
            type: 'HOMESTEAD',
            amount: 25000,
            percentage: 5.88,
            description: 'Homestead Exemption',
            effectiveDate: new Date(`${assessmentYear}-01-01`),
            status: 'ACTIVE',
          },
        ],
        taxRates: [
          {
            taxingEntity: 'School District',
            rate: 0.015,
            amount: 6375,
            description: 'School District Tax',
          },
          {
            taxingEntity: 'County',
            rate: 0.004,
            amount: 1700,
            description: 'County Tax',
          },
          {
            taxingEntity: 'City',
            rate: 0.001,
            amount: 425,
            description: 'City Tax',
          },
        ],
        totalTaxes: 8500,
        metadata: {
          assessmentMethod: 'Market Value',
          lastInspectionDate: new Date(`${assessmentYear - 1}-06-15`),
          propertyClass: 'Residential',
          neighborhoodCode: 'AUSTIN-01',
        },
      };

      return mockAssessment;

    } catch (error) {
      this.logger.error(`Error fetching tax assessment for property ID ${propertyId}:`, error);
      throw new Error(`Failed to fetch tax assessment: ${error.message}`);
    }
  }

  async getAssessmentHistory(propertyId: string, years: number = 5): Promise<TaxAssessment[]> {
    try {
      this.logger.log(`Fetching assessment history for property ID: ${propertyId} for ${years} years`);

      // Mock implementation - simulate API call
      const currentYear = new Date().getFullYear();
      const assessments: TaxAssessment[] = [];

      for (let i = 0; i < years; i++) {
        const year = currentYear - i;
        const baseValue = 425000 - (i * 5000);
        
        assessments.push({
          id: `assessment-${propertyId}-${year}`,
          propertyId,
          assessmentYear: year,
          assessedValue: baseValue,
          marketValue: baseValue + 25000,
          landValue: 150000 - (i * 2000),
          improvementValue: baseValue - (150000 - (i * 2000)),
          assessmentDate: new Date(`${year}-01-01`),
          effectiveDate: new Date(`${year}-01-01`),
          assessmentType: 'ANNUAL',
          status: 'ACTIVE',
          exemptions: year >= 2020 ? [
            {
              type: 'HOMESTEAD',
              amount: 25000,
              percentage: 5.88,
              description: 'Homestead Exemption',
              effectiveDate: new Date(`${year}-01-01`),
              status: 'ACTIVE',
            },
          ] : [],
          taxRates: [
            {
              taxingEntity: 'School District',
              rate: 0.015,
              amount: Math.round(baseValue * 0.015),
              description: 'School District Tax',
            },
            {
              taxingEntity: 'County',
              rate: 0.004,
              amount: Math.round(baseValue * 0.004),
              description: 'County Tax',
            },
            {
              taxingEntity: 'City',
              rate: 0.001,
              amount: Math.round(baseValue * 0.001),
              description: 'City Tax',
            },
          ],
          totalTaxes: Math.round(baseValue * 0.02),
          metadata: {
            assessmentMethod: 'Market Value',
            lastInspectionDate: new Date(`${year - 1}-06-15`),
            propertyClass: 'Residential',
            neighborhoodCode: 'AUSTIN-01',
          },
        });
      }

      return assessments.reverse();

    } catch (error) {
      this.logger.error(`Error fetching assessment history for property ID ${propertyId}:`, error);
      throw new Error(`Failed to fetch assessment history: ${error.message}`);
    }
  }

  async searchAssessments(params: AssessmentSearchParams): Promise<TaxAssessment[]> {
    try {
      this.logger.log(`Searching tax assessments with params: ${JSON.stringify(params)}`);

      // Mock implementation - simulate API call
      const mockAssessments: TaxAssessment[] = [
        {
          id: 'assessment-1',
          propertyId: 'prop-123',
          assessmentYear: 2021,
          assessedValue: 425000,
          marketValue: 450000,
          landValue: 150000,
          improvementValue: 275000,
          assessmentDate: new Date('2021-01-01'),
          effectiveDate: new Date('2021-01-01'),
          assessmentType: 'ANNUAL',
          status: 'ACTIVE',
          exemptions: [
            {
              type: 'HOMESTEAD',
              amount: 25000,
              percentage: 5.88,
              description: 'Homestead Exemption',
              effectiveDate: new Date('2021-01-01'),
              status: 'ACTIVE',
            },
          ],
          taxRates: [
            {
              taxingEntity: 'School District',
              rate: 0.015,
              amount: 6375,
              description: 'School District Tax',
            },
          ],
          totalTaxes: 8500,
          metadata: {},
        },
      ];

      // Filter based on search params
      return mockAssessments.filter(assessment => {
        if (params.propertyId && assessment.propertyId !== params.propertyId) return false;
        if (params.assessmentYear && assessment.assessmentYear !== params.assessmentYear) return false;
        if (params.assessmentType && assessment.assessmentType !== params.assessmentType) return false;
        if (params.status && assessment.status !== params.status) return false;
        if (params.valueMin && assessment.assessedValue < params.valueMin) return false;
        if (params.valueMax && assessment.assessedValue > params.valueMax) return false;
        return true;
      }).slice(0, params.limit || 50);

    } catch (error) {
      this.logger.error('Error searching tax assessments:', error);
      throw new Error(`Failed to search tax assessments: ${error.message}`);
    }
  }

  async getTaxRates(jurisdiction: string, year: number): Promise<TaxRate[]> {
    try {
      this.logger.log(`Fetching tax rates for jurisdiction: ${jurisdiction}, year: ${year}`);

      // Mock implementation - simulate API call
      const mockTaxRates: TaxRate[] = [
        {
          taxingEntity: 'School District',
          rate: 0.015,
          amount: 0,
          description: 'School District Tax Rate',
        },
        {
          taxingEntity: 'County',
          rate: 0.004,
          amount: 0,
          description: 'County Tax Rate',
        },
        {
          taxingEntity: 'City',
          rate: 0.001,
          amount: 0,
          description: 'City Tax Rate',
        },
        {
          taxingEntity: 'Special District',
          rate: 0.0005,
          amount: 0,
          description: 'Special District Tax Rate',
        },
      ];

      return mockTaxRates;

    } catch (error) {
      this.logger.error(`Error fetching tax rates for jurisdiction ${jurisdiction}:`, error);
      throw new Error(`Failed to fetch tax rates: ${error.message}`);
    }
  }

  async getExemptions(propertyId: string): Promise<TaxExemption[]> {
    try {
      this.logger.log(`Fetching tax exemptions for property ID: ${propertyId}`);

      // Mock implementation - simulate API call
      const mockExemptions: TaxExemption[] = [
        {
          type: 'HOMESTEAD',
          amount: 25000,
          percentage: 5.88,
          description: 'Homestead Exemption',
          effectiveDate: new Date('2021-01-01'),
          status: 'ACTIVE',
        },
        {
          type: 'SENIOR',
          amount: 10000,
          percentage: 2.35,
          description: 'Senior Citizen Exemption',
          effectiveDate: new Date('2021-01-01'),
          status: 'ACTIVE',
        },
      ];

      return mockExemptions;

    } catch (error) {
      this.logger.error(`Error fetching tax exemptions for property ID ${propertyId}:`, error);
      throw new Error(`Failed to fetch tax exemptions: ${error.message}`);
    }
  }

  async calculateTaxes(
    assessedValue: number,
    exemptions: TaxExemption[],
    taxRates: TaxRate[],
  ): Promise<{
    taxableValue: number;
    totalExemptions: number;
    totalTaxes: number;
    breakdown: TaxRate[];
  }> {
    try {
      this.logger.log(`Calculating taxes for assessed value: ${assessedValue}`);

      const totalExemptions = exemptions.reduce((sum, exemption) => sum + exemption.amount, 0);
      const taxableValue = Math.max(0, assessedValue - totalExemptions);

      const breakdown = taxRates.map(rate => ({
        ...rate,
        amount: Math.round(taxableValue * rate.rate),
      }));

      const totalTaxes = breakdown.reduce((sum, rate) => sum + rate.amount, 0);

      return {
        taxableValue,
        totalExemptions,
        totalTaxes,
        breakdown,
      };

    } catch (error) {
      this.logger.error('Error calculating taxes:', error);
      throw new Error(`Failed to calculate taxes: ${error.message}`);
    }
  }

  async validatePropertyId(propertyId: string): Promise<{
    isValid: boolean;
    normalizedId?: string;
    confidence: number;
  }> {
    try {
      this.logger.log(`Validating property ID: ${propertyId}`);

      // Mock implementation - simulate property ID validation
      return {
        isValid: true,
        normalizedId: propertyId,
        confidence: 0.95,
      };

    } catch (error) {
      this.logger.error('Error validating property ID:', error);
      throw new Error(`Failed to validate property ID: ${error.message}`);
    }
  }

  private async makeApiCall(endpoint: string, params: Record<string, any>): Promise<any> {
    // Mock implementation - simulate API call
    this.logger.debug(`Making API call to ${endpoint} with params: ${JSON.stringify(params)}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 120));
    
    return { success: true, data: {} };
  }
}
