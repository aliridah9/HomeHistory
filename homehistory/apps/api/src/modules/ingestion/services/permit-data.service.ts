import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class PermitDataService {
  private readonly logger = new Logger(PermitDataService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.permit-data.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PERMIT_DATA_API_KEY') || '';
  }

  async searchPermits(params: PermitSearchParams): Promise<BuildingPermit[]> {
    try {
      this.logger.log(`Searching building permits with params: ${JSON.stringify(params)}`);

      // Mock implementation - simulate API call
      const mockPermits: BuildingPermit[] = [
        {
          id: 'permit-1',
          permitNumber: '2021-BLD-001234',
          propertyId: 'prop-123',
          address: '123 Main St, Austin, TX 78701',
          permitType: 'RENOVATION',
          status: 'COMPLETED',
          description: 'Kitchen and bathroom renovation',
          estimatedCost: 45000,
          actualCost: 48000,
          squareFootage: 500,
          contractor: 'ABC Construction Co.',
          contractorLicense: 'TX-12345',
          applicantName: 'Jane Doe',
          applicantPhone: '512-555-0123',
          applicantEmail: 'jane.doe@email.com',
          appliedDate: new Date('2021-03-15'),
          approvedDate: new Date('2021-03-22'),
          issuedDate: new Date('2021-03-25'),
          startDate: new Date('2021-04-01'),
          completionDate: new Date('2021-06-15'),
          expirationDate: new Date('2022-03-25'),
          inspections: [
            {
              id: 'inspection-1',
              permitId: 'permit-1',
              inspectionType: 'ELECTRICAL',
              status: 'PASSED',
              scheduledDate: new Date('2021-05-10'),
              completedDate: new Date('2021-05-10'),
              inspector: 'John Smith',
              notes: 'All electrical work meets code requirements',
              result: 'PASS',
            },
            {
              id: 'inspection-2',
              permitId: 'permit-1',
              inspectionType: 'PLUMBING',
              status: 'PASSED',
              scheduledDate: new Date('2021-05-12'),
              completedDate: new Date('2021-05-12'),
              inspector: 'Mary Johnson',
              notes: 'Plumbing installation completed successfully',
              result: 'PASS',
            },
            {
              id: 'inspection-3',
              permitId: 'permit-1',
              inspectionType: 'FINAL',
              status: 'PASSED',
              scheduledDate: new Date('2021-06-15'),
              completedDate: new Date('2021-06-15'),
              inspector: 'Bob Wilson',
              notes: 'Final inspection passed - project completed',
              result: 'PASS',
            },
          ],
          documents: [
            {
              id: 'doc-1',
              permitId: 'permit-1',
              documentType: 'APPLICATION',
              fileName: 'permit-application.pdf',
              fileUrl: 'https://example.com/documents/permit-application.pdf',
              fileSize: 1024000,
              uploadedDate: new Date('2021-03-15'),
              description: 'Building permit application',
            },
            {
              id: 'doc-2',
              permitId: 'permit-1',
              documentType: 'PLANS',
              fileName: 'renovation-plans.pdf',
              fileUrl: 'https://example.com/documents/renovation-plans.pdf',
              fileSize: 2048000,
              uploadedDate: new Date('2021-03-15'),
              description: 'Architectural plans for renovation',
            },
          ],
          metadata: {
            projectType: 'Residential Renovation',
            buildingCode: 'IRC 2018',
            energyCode: 'IECC 2018',
            zoningDistrict: 'SF-3',
            neighborhood: 'Downtown',
          },
        },
        {
          id: 'permit-2',
          permitNumber: '2020-BLD-005678',
          propertyId: 'prop-123',
          address: '123 Main St, Austin, TX 78701',
          permitType: 'ADDITION',
          status: 'COMPLETED',
          description: 'Second story addition',
          estimatedCost: 120000,
          actualCost: 125000,
          squareFootage: 800,
          contractor: 'XYZ Builders',
          contractorLicense: 'TX-67890',
          applicantName: 'Jane Doe',
          applicantPhone: '512-555-0123',
          applicantEmail: 'jane.doe@email.com',
          appliedDate: new Date('2020-06-10'),
          approvedDate: new Date('2020-06-20'),
          issuedDate: new Date('2020-06-25'),
          startDate: new Date('2020-07-01'),
          completionDate: new Date('2020-12-15'),
          expirationDate: new Date('2021-06-25'),
          inspections: [
            {
              id: 'inspection-4',
              permitId: 'permit-2',
              inspectionType: 'FOUNDATION',
              status: 'PASSED',
              scheduledDate: new Date('2020-07-15'),
              completedDate: new Date('2020-07-15'),
              inspector: 'John Smith',
              notes: 'Foundation inspection passed',
              result: 'PASS',
            },
            {
              id: 'inspection-5',
              permitId: 'permit-2',
              inspectionType: 'FRAMING',
              status: 'PASSED',
              scheduledDate: new Date('2020-08-20'),
              completedDate: new Date('2020-08-20'),
              inspector: 'Bob Wilson',
              notes: 'Framing inspection passed',
              result: 'PASS',
            },
          ],
          documents: [],
          metadata: {
            projectType: 'Residential Addition',
            buildingCode: 'IRC 2018',
            energyCode: 'IECC 2018',
            zoningDistrict: 'SF-3',
            neighborhood: 'Downtown',
          },
        },
      ];

      // Filter based on search params
      return mockPermits.filter(permit => {
        if (params.propertyId && permit.propertyId !== params.propertyId) return false;
        if (params.permitType && permit.permitType !== params.permitType) return false;
        if (params.status && permit.status !== params.status) return false;
        if (params.dateFrom && permit.appliedDate < params.dateFrom) return false;
        if (params.dateTo && permit.appliedDate > params.dateTo) return false;
        if (params.costMin && permit.estimatedCost < params.costMin) return false;
        if (params.costMax && permit.estimatedCost > params.costMax) return false;
        if (params.contractor && permit.contractor !== params.contractor) return false;
        return true;
      }).slice(0, params.limit || 50);

    } catch (error) {
      this.logger.error('Error searching building permits:', error);
      throw new Error(`Failed to search building permits: ${error.message}`);
    }
  }

  async getPermitDetails(permitId: string): Promise<BuildingPermit | null> {
    try {
      this.logger.log(`Fetching permit details for permit ID: ${permitId}`);

      // Mock implementation - simulate API call
      const mockPermit: BuildingPermit = {
        id: permitId,
        permitNumber: '2021-BLD-001234',
        propertyId: 'prop-123',
        address: '123 Main St, Austin, TX 78701',
        permitType: 'RENOVATION',
        status: 'COMPLETED',
        description: 'Kitchen and bathroom renovation with new appliances and fixtures',
        estimatedCost: 45000,
        actualCost: 48000,
        squareFootage: 500,
        contractor: 'ABC Construction Co.',
        contractorLicense: 'TX-12345',
        applicantName: 'Jane Doe',
        applicantPhone: '512-555-0123',
        applicantEmail: 'jane.doe@email.com',
        appliedDate: new Date('2021-03-15'),
        approvedDate: new Date('2021-03-22'),
        issuedDate: new Date('2021-03-25'),
        startDate: new Date('2021-04-01'),
        completionDate: new Date('2021-06-15'),
        expirationDate: new Date('2022-03-25'),
        inspections: [
          {
            id: 'inspection-1',
            permitId,
            inspectionType: 'ELECTRICAL',
            status: 'PASSED',
            scheduledDate: new Date('2021-05-10'),
            completedDate: new Date('2021-05-10'),
            inspector: 'John Smith',
            notes: 'All electrical work meets code requirements. New circuits properly installed.',
            result: 'PASS',
          },
          {
            id: 'inspection-2',
            permitId,
            inspectionType: 'PLUMBING',
            status: 'PASSED',
            scheduledDate: new Date('2021-05-12'),
            completedDate: new Date('2021-05-12'),
            inspector: 'Mary Johnson',
            notes: 'Plumbing installation completed successfully. All fixtures properly connected.',
            result: 'PASS',
          },
          {
            id: 'inspection-3',
            permitId,
            inspectionType: 'FINAL',
            status: 'PASSED',
            scheduledDate: new Date('2021-06-15'),
            completedDate: new Date('2021-06-15'),
            inspector: 'Bob Wilson',
            notes: 'Final inspection passed - project completed according to approved plans',
            result: 'PASS',
          },
        ],
        documents: [
          {
            id: 'doc-1',
            permitId,
            documentType: 'APPLICATION',
            fileName: 'permit-application.pdf',
            fileUrl: 'https://example.com/documents/permit-application.pdf',
            fileSize: 1024000,
            uploadedDate: new Date('2021-03-15'),
            description: 'Building permit application with contractor information',
          },
          {
            id: 'doc-2',
            permitId,
            documentType: 'PLANS',
            fileName: 'renovation-plans.pdf',
            fileUrl: 'https://example.com/documents/renovation-plans.pdf',
            fileSize: 2048000,
            uploadedDate: new Date('2021-03-15'),
            description: 'Detailed architectural plans for kitchen and bathroom renovation',
          },
          {
            id: 'doc-3',
            permitId,
            documentType: 'SPECIFICATIONS',
            fileName: 'specifications.pdf',
            fileUrl: 'https://example.com/documents/specifications.pdf',
            fileSize: 1536000,
            uploadedDate: new Date('2021-03-15'),
            description: 'Material specifications and construction details',
          },
        ],
        metadata: {
          projectType: 'Residential Renovation',
          buildingCode: 'IRC 2018',
          energyCode: 'IECC 2018',
          zoningDistrict: 'SF-3',
          neighborhood: 'Downtown',
          workDescription: 'Kitchen and bathroom renovation including new cabinets, countertops, appliances, and fixtures',
          structuralChanges: false,
          squareFootageAdded: 0,
          squareFootageModified: 500,
        },
      };

      return mockPermit;

    } catch (error) {
      this.logger.error(`Error fetching permit details for permit ID ${permitId}:`, error);
      throw new Error(`Failed to fetch permit details: ${error.message}`);
    }
  }

  async getPermitHistory(propertyId: string, years: number = 10): Promise<BuildingPermit[]> {
    try {
      this.logger.log(`Fetching permit history for property ID: ${propertyId} for ${years} years`);

      // Mock implementation - simulate API call
      const mockPermits: BuildingPermit[] = [
        {
          id: 'permit-1',
          permitNumber: '2021-BLD-001234',
          propertyId,
          address: '123 Main St, Austin, TX 78701',
          permitType: 'RENOVATION',
          status: 'COMPLETED',
          description: 'Kitchen and bathroom renovation',
          estimatedCost: 45000,
          actualCost: 48000,
          squareFootage: 500,
          contractor: 'ABC Construction Co.',
          contractorLicense: 'TX-12345',
          applicantName: 'Jane Doe',
          appliedDate: new Date('2021-03-15'),
          completionDate: new Date('2021-06-15'),
          inspections: [],
          documents: [],
          metadata: {},
        },
        {
          id: 'permit-2',
          permitNumber: '2020-BLD-005678',
          propertyId,
          address: '123 Main St, Austin, TX 78701',
          permitType: 'ADDITION',
          status: 'COMPLETED',
          description: 'Second story addition',
          estimatedCost: 120000,
          actualCost: 125000,
          squareFootage: 800,
          contractor: 'XYZ Builders',
          contractorLicense: 'TX-67890',
          applicantName: 'Jane Doe',
          appliedDate: new Date('2020-06-10'),
          completionDate: new Date('2020-12-15'),
          inspections: [],
          documents: [],
          metadata: {},
        },
      ];

      return mockPermits;

    } catch (error) {
      this.logger.error(`Error fetching permit history for property ID ${propertyId}:`, error);
      throw new Error(`Failed to fetch permit history: ${error.message}`);
    }
  }

  async getActivePermits(propertyId: string): Promise<BuildingPermit[]> {
    try {
      this.logger.log(`Fetching active permits for property ID: ${propertyId}`);

      // Mock implementation - simulate API call
      const activeStatuses = ['APPLIED', 'APPROVED', 'ISSUED', 'IN_PROGRESS'];
      const mockPermits: BuildingPermit[] = [
        {
          id: 'permit-3',
          permitNumber: '2022-BLD-009876',
          propertyId,
          address: '123 Main St, Austin, TX 78701',
          permitType: 'ELECTRICAL',
          status: 'IN_PROGRESS',
          description: 'Electrical panel upgrade',
          estimatedCost: 8000,
          contractor: 'DEF Electric',
          contractorLicense: 'TX-11111',
          applicantName: 'Jane Doe',
          appliedDate: new Date('2022-01-15'),
          issuedDate: new Date('2022-01-25'),
          startDate: new Date('2022-02-01'),
          inspections: [],
          documents: [],
          metadata: {},
        },
      ];

      return mockPermits.filter(permit => activeStatuses.includes(permit.status));

    } catch (error) {
      this.logger.error(`Error fetching active permits for property ID ${propertyId}:`, error);
      throw new Error(`Failed to fetch active permits: ${error.message}`);
    }
  }

  async getPermitStats(propertyId: string): Promise<{
    totalPermits: number;
    completedPermits: number;
    activePermits: number;
    totalValue: number;
    averageCost: number;
    permitTypes: Record<string, number>;
  }> {
    try {
      this.logger.log(`Fetching permit stats for property ID: ${propertyId}`);

      // Mock implementation - simulate API call
      return {
        totalPermits: 5,
        completedPermits: 4,
        activePermits: 1,
        totalValue: 178000,
        averageCost: 35600,
        permitTypes: {
          'RENOVATION': 2,
          'ADDITION': 1,
          'ELECTRICAL': 1,
          'PLUMBING': 1,
        },
      };

    } catch (error) {
      this.logger.error(`Error fetching permit stats for property ID ${propertyId}:`, error);
      throw new Error(`Failed to fetch permit stats: ${error.message}`);
    }
  }

  async validatePermitNumber(permitNumber: string): Promise<{
    isValid: boolean;
    normalizedNumber?: string;
    confidence: number;
  }> {
    try {
      this.logger.log(`Validating permit number: ${permitNumber}`);

      // Mock implementation - simulate permit number validation
      return {
        isValid: true,
        normalizedNumber: permitNumber,
        confidence: 0.95,
      };

    } catch (error) {
      this.logger.error('Error validating permit number:', error);
      throw new Error(`Failed to validate permit number: ${error.message}`);
    }
  }

  private async makeApiCall(endpoint: string, params: Record<string, any>): Promise<any> {
    // Mock implementation - simulate API call
    this.logger.debug(`Making API call to ${endpoint} with params: ${JSON.stringify(params)}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 130));
    
    return { success: true, data: {} };
  }
}
