/**
 * Vector Service - pgvector operations for semantic search
 * Handles vector similarity search with Supabase pgvector extension
 */
import { PrismaService } from '../database/prisma.service';
export interface VectorSearchOptions {
    embedding: number[];
    threshold?: number;
    limit?: number;
    filters?: Record<string, any>;
}
export interface VectorSearchResult {
    id: string;
    distance: number;
    similarity: number;
    content: string;
    metadata: any;
}
export declare class VectorService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    /**
     * Perform vector similarity search
     */
    searchSimilar(options: VectorSearchOptions): Promise<VectorSearchResult[]>;
    /**
     * Find similar properties by property ID
     */
    findSimilarProperties(propertyId: string, options?: {
        limit?: number;
        threshold?: number;
        excludeSelf?: boolean;
    }): Promise<VectorSearchResult[]>;
    /**
     * Get vector search statistics
     */
    getVectorStats(): Promise<{
        totalEmbeddings: number;
        averageDimensions: number;
        indexHealth: string;
    }>;
    /**
     * Optimize vector search performance
     */
    optimizeVectorIndex(): Promise<{
        success: boolean;
        message: string;
    }>;
    generateEmbedding(text: string): Promise<number[]>;
    parseSearchIntent(query: string): Promise<any>;
}
//# sourceMappingURL=vector.service.d.ts.map
