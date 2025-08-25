import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService {
    private supabase;
    private adminSupabase;
    constructor();
    getClient(): SupabaseClient;
    getAdminClient(): SupabaseClient;
    uploadFile(bucket: string, path: string, file: Buffer, contentType: string): Promise<{
        id: string;
        path: string;
        fullPath: string;
    }>;
    getFileUrl(bucket: string, path: string): Promise<string>;
    storeEmbedding(table: string, id: string, embedding: number[], metadata: any): Promise<null>;
    searchByVector(table: string, queryEmbedding: number[], limit?: number, threshold?: number): Promise<any>;
}
//# sourceMappingURL=supabase.service.d.ts.map
