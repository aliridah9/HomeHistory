import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '../../config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private adminSupabase: SupabaseClient;

  constructor() {
    const config = getConfig();
    
    // Client with anon key for user operations
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey,
    );

    // Admin client with service key for system operations
    this.adminSupabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    return this.adminSupabase;
  }

  // Storage operations
  async uploadFile(bucket: string, path: string, file: Buffer, contentType: string) {
    const { data, error } = await this.adminSupabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) throw error;
    return data;
  }

  async getFileUrl(bucket: string, path: string): Promise<string> {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Vector operations for pgvector
  async storeEmbedding(table: string, id: string, embedding: number[], metadata: any) {
    const { data, error } = await this.adminSupabase
      .from(table)
      .upsert({
        id,
        embedding,
        metadata,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
    return data;
  }

  async searchByVector(
    table: string,
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.8,
  ) {
    const { data, error } = await this.adminSupabase.rpc('search_vectors', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      table_name: table,
    });

    if (error) throw error;
    return data;
  }
}
