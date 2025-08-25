"use strict";
/**
 * Test fixtures and mock data for HomeHistory API tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testUtils = exports.apiResponseTemplates = exports.mockPropertyScores = exports.mockDataSources = exports.mockNotifications = exports.mockReports = exports.mockDocuments = exports.mockMaintenanceRecords = exports.mockProperties = exports.mockUsers = void 0;
exports.mockUsers = {
    regularUser: {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
    },
    adminUser: {
        id: 'admin-123',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
    },
};
exports.mockProperties = {
    singleFamily: {
        id: 'property-123',
        userId: 'user-123',
        address: '123 Main Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        propertyType: 'SINGLE_FAMILY',
        purchasePrice: 750000,
        purchaseDate: new Date('2022-06-15'),
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1800,
        lotSize: 0.15,
        yearBuilt: 1985,
        latitude: 37.7749,
        longitude: -122.4194,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
    },
    condo: {
        id: 'property-456',
        userId: 'user-123',
        address: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        propertyType: 'CONDO',
        purchasePrice: 500000,
        purchaseDate: new Date('2023-03-20'),
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1200,
        yearBuilt: 2010,
        latitude: 34.0522,
        longitude: -118.2437,
        createdAt: new Date('2023-03-21'),
        updatedAt: new Date('2023-03-21'),
    },
};
exports.mockMaintenanceRecords = {
    hvacMaintenance: {
        id: 'maintenance-123',
        propertyId: 'property-123',
        title: 'HVAC Annual Maintenance',
        description: 'Annual HVAC system inspection and maintenance',
        maintenanceType: 'hvac',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        scheduledDate: new Date('2024-06-01'),
        estimatedCost: 200,
        createdBy: 'user-123',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
    },
    plumbingRepair: {
        id: 'maintenance-456',
        propertyId: 'property-123',
        title: 'Kitchen Faucet Repair',
        description: 'Replace leaky kitchen faucet',
        maintenanceType: 'plumbing',
        priority: 'HIGH',
        status: 'COMPLETED',
        scheduledDate: new Date('2024-02-10'),
        completedDate: new Date('2024-02-12'),
        estimatedCost: 150,
        actualCost: 175,
        notes: 'Had to replace additional parts',
        createdBy: 'user-123',
        createdAt: new Date('2024-02-08'),
        updatedAt: new Date('2024-02-12'),
    },
};
exports.mockDocuments = {
    inspectionReport: {
        id: 'doc-123',
        type: 'inspection_report',
        source: 'manual_upload',
        fileUrl: 'https://storage.supabase.co/documents/inspection_123.pdf',
        fileName: 'home_inspection_report.pdf',
        fileSize: 2048576, // 2MB
        mimeType: 'application/pdf',
        propertyId: 'property-123',
        status: 'VERIFIED',
        extractedText: {
            summary: 'Overall property condition is good',
            issues: ['Minor electrical updates needed', 'Roof inspection recommended'],
        },
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-22'),
    },
    deed: {
        id: 'doc-456',
        type: 'deed',
        source: 'county_records',
        fileUrl: 'https://storage.supabase.co/documents/deed_456.pdf',
        fileName: 'property_deed.pdf',
        fileSize: 1024000, // 1MB
        mimeType: 'application/pdf',
        propertyId: 'property-123',
        status: 'PENDING',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
    },
};
exports.mockReports = {
    propertyReport: {
        id: 'report-123',
        propertyId: 'property-123',
        summary: 'Comprehensive property analysis showing good overall condition with minor maintenance needs.',
        incidentsJson: {
            incidents: [
                {
                    type: 'water_damage',
                    severity: 'low',
                    date: '2023-12-15',
                    description: 'Minor water stain in basement, resolved',
                },
            ],
        },
        insuranceJson: {
            riskLevel: 'low',
            recommendations: ['Install smart water leak detectors'],
            estimatedPremium: 1200,
        },
        status: 'PUBLISHED',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-20'),
    },
};
exports.mockNotifications = {
    maintenanceReminder: {
        id: 'notification-123',
        userId: 'user-123',
        type: 'maintenance_reminder',
        title: 'HVAC Maintenance Due',
        message: 'Your HVAC annual maintenance is scheduled for tomorrow.',
        data: {
            maintenanceId: 'maintenance-123',
            propertyAddress: '123 Main Street',
        },
        read: false,
        channels: ['in_app', 'email'],
        entityType: 'maintenance',
        entityId: 'maintenance-123',
        createdAt: new Date('2024-05-31'),
        updatedAt: new Date('2024-05-31'),
    },
    reportReady: {
        id: 'notification-456',
        userId: 'user-123',
        type: 'report_ready',
        title: 'Property Report Ready',
        message: 'Your property report for 123 Main Street is now available.',
        data: {
            reportId: 'report-123',
            propertyAddress: '123 Main Street',
        },
        read: true,
        readAt: new Date('2024-02-21'),
        channels: ['in_app', 'push'],
        entityType: 'report',
        entityId: 'report-123',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-21'),
    },
};
exports.mockDataSources = {
    zillow: {
        id: 'source-123',
        name: 'Zillow',
        apiUrl: 'https://api.zillow.com',
        lastSynced: new Date('2024-03-01'),
        isActive: true,
        syncFrequency: 'daily',
    },
    countyRecords: {
        id: 'source-456',
        name: 'County Records',
        apiUrl: 'https://api.countyrecords.gov',
        lastSynced: new Date('2024-02-28'),
        isActive: true,
        syncFrequency: 'weekly',
    },
};
exports.mockPropertyScores = {
    goodScore: {
        propertyId: 'property-123',
        overallScore: 85,
        qualityScore: 88,
        safetyScore: 90,
        valueScore: 82,
        locationScore: 80,
        breakdown: {
            quality: {
                score: 88,
                factors: ['Well-maintained exterior', 'Updated kitchen', 'Good structural condition'],
            },
            safety: {
                score: 90,
                factors: ['Low crime area', 'Good lighting', 'Secure neighborhood'],
            },
            value: {
                score: 82,
                factors: ['Competitive market price', 'Good appreciation potential'],
            },
            location: {
                score: 80,
                factors: ['Good school district', 'Public transportation access'],
            },
        },
        calculatedAt: new Date('2024-03-01'),
    },
};
// API Response Templates
exports.apiResponseTemplates = {
    success: (data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        path: '/api/test',
    }),
    error: (message, statusCode = 400) => ({
        statusCode,
        timestamp: new Date().toISOString(),
        path: '/api/test',
        message,
        error: 'Bad Request',
    }),
    paginatedResponse: (items, page = 1, limit = 10) => ({
        success: true,
        data: {
            items,
            pagination: {
                page,
                limit,
                total: items.length,
                totalPages: Math.ceil(items.length / limit),
            },
        },
        timestamp: new Date().toISOString(),
        path: '/api/test',
    }),
};
// Test Utilities
exports.testUtils = {
    /**
     * Generate a valid JWT token for testing
     */
    generateJwtToken: (userId = 'user-123', role = 'USER') => {
        const jwt = require('jsonwebtoken');
        return jwt.sign({ sub: userId, email: 'test@example.com', role }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    },
    /**
     * Create a mock request object
     */
    mockRequest: (overrides = {}) => ({
        user: exports.mockUsers.regularUser,
        headers: {},
        query: {},
        params: {},
        body: {},
        ...overrides,
    }),
    /**
     * Create a mock response object
     */
    mockResponse: () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.send = jest.fn().mockReturnValue(res);
        res.set = jest.fn().mockReturnValue(res);
        return res;
    },
    /**
     * Wait for a specified amount of time
     */
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    /**
     * Generate random test data
     */
    randomString: (length = 10) => {
        return Math.random().toString(36).substring(2, length + 2);
    },
    randomEmail: () => {
        return `test-${exports.testUtils.randomString(8)}@example.com`;
    },
    randomAddress: () => {
        const streetNumber = Math.floor(Math.random() * 9999) + 1;
        const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Maple Ln'];
        const street = streets[Math.floor(Math.random() * streets.length)];
        return `${streetNumber} ${street}`;
    },
};
exports.default = {
    mockUsers: exports.mockUsers,
    mockProperties: exports.mockProperties,
    mockMaintenanceRecords: exports.mockMaintenanceRecords,
    mockDocuments: exports.mockDocuments,
    mockReports: exports.mockReports,
    mockNotifications: exports.mockNotifications,
    mockDataSources: exports.mockDataSources,
    mockPropertyScores: exports.mockPropertyScores,
    apiResponseTemplates: exports.apiResponseTemplates,
    testUtils: exports.testUtils,
};
//# sourceMappingURL=test-data.js.map