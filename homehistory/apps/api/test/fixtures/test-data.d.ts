/**
 * Test fixtures and mock data for HomeHistory API tests
 */
export declare const mockUsers: {
    regularUser: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "USER";
        createdAt: Date;
        updatedAt: Date;
    };
    adminUser: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "ADMIN";
        createdAt: Date;
        updatedAt: Date;
    };
};
export declare const mockProperties: {
    singleFamily: {
        id: string;
        userId: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: "SINGLE_FAMILY";
        purchasePrice: number;
        purchaseDate: Date;
        bedrooms: number;
        bathrooms: number;
        squareFeet: number;
        lotSize: number;
        yearBuilt: number;
        latitude: number;
        longitude: number;
        createdAt: Date;
        updatedAt: Date;
    };
    condo: {
        id: string;
        userId: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: "CONDO";
        purchasePrice: number;
        purchaseDate: Date;
        bedrooms: number;
        bathrooms: number;
        squareFeet: number;
        yearBuilt: number;
        latitude: number;
        longitude: number;
        createdAt: Date;
        updatedAt: Date;
    };
};
export declare const mockMaintenanceRecords: {
    hvacMaintenance: {
        id: string;
        propertyId: string;
        title: string;
        description: string;
        maintenanceType: string;
        priority: "MEDIUM";
        status: "SCHEDULED";
        scheduledDate: Date;
        estimatedCost: number;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    };
    plumbingRepair: {
        id: string;
        propertyId: string;
        title: string;
        description: string;
        maintenanceType: string;
        priority: "HIGH";
        status: "COMPLETED";
        scheduledDate: Date;
        completedDate: Date;
        estimatedCost: number;
        actualCost: number;
        notes: string;
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;
    };
};
export declare const mockDocuments: {
    inspectionReport: {
        id: string;
        type: string;
        source: string;
        fileUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        propertyId: string;
        status: "VERIFIED";
        extractedText: {
            summary: string;
            issues: string[];
        };
        createdAt: Date;
        updatedAt: Date;
    };
    deed: {
        id: string;
        type: string;
        source: string;
        fileUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        propertyId: string;
        status: "PENDING";
        createdAt: Date;
        updatedAt: Date;
    };
};
export declare const mockReports: {
    propertyReport: {
        id: string;
        propertyId: string;
        summary: string;
        incidentsJson: {
            incidents: {
                type: string;
                severity: string;
                date: string;
                description: string;
            }[];
        };
        insuranceJson: {
            riskLevel: string;
            recommendations: string[];
            estimatedPremium: number;
        };
        status: "PUBLISHED";
        createdAt: Date;
        updatedAt: Date;
    };
};
export declare const mockNotifications: {
    maintenanceReminder: {
        id: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        data: {
            maintenanceId: string;
            propertyAddress: string;
        };
        read: boolean;
        channels: string[];
        entityType: string;
        entityId: string;
        createdAt: Date;
        updatedAt: Date;
    };
    reportReady: {
        id: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        data: {
            reportId: string;
            propertyAddress: string;
        };
        read: boolean;
        readAt: Date;
        channels: string[];
        entityType: string;
        entityId: string;
        createdAt: Date;
        updatedAt: Date;
    };
};
export declare const mockDataSources: {
    zillow: {
        id: string;
        name: string;
        apiUrl: string;
        lastSynced: Date;
        isActive: boolean;
        syncFrequency: string;
    };
    countyRecords: {
        id: string;
        name: string;
        apiUrl: string;
        lastSynced: Date;
        isActive: boolean;
        syncFrequency: string;
    };
};
export declare const mockPropertyScores: {
    goodScore: {
        propertyId: string;
        overallScore: number;
        qualityScore: number;
        safetyScore: number;
        valueScore: number;
        locationScore: number;
        breakdown: {
            quality: {
                score: number;
                factors: string[];
            };
            safety: {
                score: number;
                factors: string[];
            };
            value: {
                score: number;
                factors: string[];
            };
            location: {
                score: number;
                factors: string[];
            };
        };
        calculatedAt: Date;
    };
};
export declare const apiResponseTemplates: {
    success: (data: any) => {
        success: boolean;
        data: any;
        timestamp: string;
        path: string;
    };
    error: (message: string, statusCode?: number) => {
        statusCode: number;
        timestamp: string;
        path: string;
        message: string;
        error: string;
    };
    paginatedResponse: (items: any[], page?: number, limit?: number) => {
        success: boolean;
        data: {
            items: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        };
        timestamp: string;
        path: string;
    };
};
export declare const testUtils: {
    /**
     * Generate a valid JWT token for testing
     */
    generateJwtToken: (userId?: string, role?: string) => any;
    /**
     * Create a mock request object
     */
    mockRequest: (overrides?: any) => any;
    /**
     * Create a mock response object
     */
    mockResponse: () => any;
    /**
     * Wait for a specified amount of time
     */
    wait: (ms: number) => Promise<unknown>;
    /**
     * Generate random test data
     */
    randomString: (length?: number) => string;
    randomEmail: () => string;
    randomAddress: () => string;
};
declare const _default: {
    mockUsers: {
        regularUser: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: "USER";
            createdAt: Date;
            updatedAt: Date;
        };
        adminUser: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: "ADMIN";
            createdAt: Date;
            updatedAt: Date;
        };
    };
    mockProperties: {
        singleFamily: {
            id: string;
            userId: string;
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: "SINGLE_FAMILY";
            purchasePrice: number;
            purchaseDate: Date;
            bedrooms: number;
            bathrooms: number;
            squareFeet: number;
            lotSize: number;
            yearBuilt: number;
            latitude: number;
            longitude: number;
            createdAt: Date;
            updatedAt: Date;
        };
        condo: {
            id: string;
            userId: string;
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: "CONDO";
            purchasePrice: number;
            purchaseDate: Date;
            bedrooms: number;
            bathrooms: number;
            squareFeet: number;
            yearBuilt: number;
            latitude: number;
            longitude: number;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    mockMaintenanceRecords: {
        hvacMaintenance: {
            id: string;
            propertyId: string;
            title: string;
            description: string;
            maintenanceType: string;
            priority: "MEDIUM";
            status: "SCHEDULED";
            scheduledDate: Date;
            estimatedCost: number;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
        };
        plumbingRepair: {
            id: string;
            propertyId: string;
            title: string;
            description: string;
            maintenanceType: string;
            priority: "HIGH";
            status: "COMPLETED";
            scheduledDate: Date;
            completedDate: Date;
            estimatedCost: number;
            actualCost: number;
            notes: string;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    mockDocuments: {
        inspectionReport: {
            id: string;
            type: string;
            source: string;
            fileUrl: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            propertyId: string;
            status: "VERIFIED";
            extractedText: {
                summary: string;
                issues: string[];
            };
            createdAt: Date;
            updatedAt: Date;
        };
        deed: {
            id: string;
            type: string;
            source: string;
            fileUrl: string;
            fileName: string;
            fileSize: number;
            mimeType: string;
            propertyId: string;
            status: "PENDING";
            createdAt: Date;
            updatedAt: Date;
        };
    };
    mockReports: {
        propertyReport: {
            id: string;
            propertyId: string;
            summary: string;
            incidentsJson: {
                incidents: {
                    type: string;
                    severity: string;
                    date: string;
                    description: string;
                }[];
            };
            insuranceJson: {
                riskLevel: string;
                recommendations: string[];
                estimatedPremium: number;
            };
            status: "PUBLISHED";
            createdAt: Date;
            updatedAt: Date;
        };
    };
    mockNotifications: {
        maintenanceReminder: {
            id: string;
            userId: string;
            type: string;
            title: string;
            message: string;
            data: {
                maintenanceId: string;
                propertyAddress: string;
            };
            read: boolean;
            channels: string[];
            entityType: string;
            entityId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        reportReady: {
            id: string;
            userId: string;
            type: string;
            title: string;
            message: string;
            data: {
                reportId: string;
                propertyAddress: string;
            };
            read: boolean;
            readAt: Date;
            channels: string[];
            entityType: string;
            entityId: string;
            createdAt: Date;
            updatedAt: Date;
        };
    };
    mockDataSources: {
        zillow: {
            id: string;
            name: string;
            apiUrl: string;
            lastSynced: Date;
            isActive: boolean;
            syncFrequency: string;
        };
        countyRecords: {
            id: string;
            name: string;
            apiUrl: string;
            lastSynced: Date;
            isActive: boolean;
            syncFrequency: string;
        };
    };
    mockPropertyScores: {
        goodScore: {
            propertyId: string;
            overallScore: number;
            qualityScore: number;
            safetyScore: number;
            valueScore: number;
            locationScore: number;
            breakdown: {
                quality: {
                    score: number;
                    factors: string[];
                };
                safety: {
                    score: number;
                    factors: string[];
                };
                value: {
                    score: number;
                    factors: string[];
                };
                location: {
                    score: number;
                    factors: string[];
                };
            };
            calculatedAt: Date;
        };
    };
    apiResponseTemplates: {
        success: (data: any) => {
            success: boolean;
            data: any;
            timestamp: string;
            path: string;
        };
        error: (message: string, statusCode?: number) => {
            statusCode: number;
            timestamp: string;
            path: string;
            message: string;
            error: string;
        };
        paginatedResponse: (items: any[], page?: number, limit?: number) => {
            success: boolean;
            data: {
                items: any[];
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    totalPages: number;
                };
            };
            timestamp: string;
            path: string;
        };
    };
    testUtils: {
        /**
         * Generate a valid JWT token for testing
         */
        generateJwtToken: (userId?: string, role?: string) => any;
        /**
         * Create a mock request object
         */
        mockRequest: (overrides?: any) => any;
        /**
         * Create a mock response object
         */
        mockResponse: () => any;
        /**
         * Wait for a specified amount of time
         */
        wait: (ms: number) => Promise<unknown>;
        /**
         * Generate random test data
         */
        randomString: (length?: number) => string;
        randomEmail: () => string;
        randomAddress: () => string;
    };
};
export default _default;
//# sourceMappingURL=test-data.d.ts.map