import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { 
  useSupabaseQuery, 
  createMutation, 
  createCacheKey,
  getSupabaseClient 
} from './useSupabaseQuery';

// 테이블 타입 헬퍼
type Tables = Database['public']['Tables'];
type TableName = keyof Tables;
type TableRow<T extends TableName> = Tables[T]['Row'];
type TableInsert<T extends TableName> = Tables[T]['Insert'];
type TableUpdate<T extends TableName> = Tables[T]['Update'];

// CRUD 훅 옵션
interface CRUDOptions<T extends TableName> {
  tableName: T;
  primaryKey?: keyof TableRow<T>;
  defaultSelect?: string;
  cacheKey?: string;
  transformData?: (data: any) => TableRow<T>[];
}

// 기본 CRUD 훅
export function useSupabaseCRUD<T extends TableName>({
  tableName,
  primaryKey = 'id' as keyof TableRow<T>,
  defaultSelect = '*',
  cacheKey,
  transformData,
}: CRUDOptions<T>) {
  const baseKey = cacheKey || tableName;
  
  // 전체 데이터 조회
  const query = useSupabaseQuery<TableRow<T>[]>(
    baseKey,
    async (supabase) => {
      const { data, error } = await supabase
        .from(tableName)
        .select(defaultSelect);
      
      if (error) throw error;
      
      const result = data || [];
      return transformData ? transformData(result) : result as TableRow<T>[];
    }
  );

  // 단일 항목 조회
  const getById = useCallback(
    async (id: any) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(tableName)
        .select(defaultSelect)
        .eq(primaryKey as string, id)
        .single();
      
      if (error) throw error;
      return data as TableRow<T>;
    },
    [tableName, primaryKey, defaultSelect]
  );

  // 생성
  const create = createMutation<TableRow<T>, TableInsert<T>>(
    async (supabase, params) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(params)
        .select(defaultSelect)
        .single();
      
      if (error) throw error;
      return data as TableRow<T>;
    },
    {
      revalidateKeys: [baseKey],
    }
  );

  // 수정
  const update = createMutation<TableRow<T>, { id: any; data: TableUpdate<T> }>(
    async (supabase, { id, data }) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq(primaryKey as string, id)
        .select(defaultSelect)
        .single();
      
      if (error) throw error;
      return result as TableRow<T>;
    },
    {
      revalidateKeys: [baseKey],
    }
  );

  // 삭제
  const remove = createMutation<boolean, any>(
    async (supabase, id) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(primaryKey as string, id);
      
      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: [baseKey],
    }
  );

  // 일괄 작업
  const bulkCreate = createMutation<TableRow<T>[], TableInsert<T>[]>(
    async (supabase, items) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(items)
        .select(defaultSelect);
      
      if (error) throw error;
      return data as TableRow<T>[];
    },
    {
      revalidateKeys: [baseKey],
    }
  );

  const bulkUpdate = createMutation<TableRow<T>[], { ids: any[]; data: TableUpdate<T> }>(
    async (supabase, { ids, data }) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .in(primaryKey as string, ids)
        .select(defaultSelect);
      
      if (error) throw error;
      return result as TableRow<T>[];
    },
    {
      revalidateKeys: [baseKey],
    }
  );

  const bulkRemove = createMutation<boolean, any[]>(
    async (supabase, ids) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in(primaryKey as string, ids);
      
      if (error) throw error;
      return true;
    },
    {
      revalidateKeys: [baseKey],
    }
  );

  return {
    // 쿼리 관련
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    
    // CRUD 작업
    getById,
    create,
    update,
    remove,
    
    // 일괄 작업
    bulkCreate,
    bulkUpdate,
    bulkRemove,
  };
}

// 조건부 쿼리를 위한 확장 훅
export function useSupabaseConditionalQuery<T extends TableName>({
  tableName,
  conditions,
  defaultSelect = '*',
  cacheKey,
  transformData,
}: CRUDOptions<T> & {
  conditions?: Record<string, any>;
}) {
  const key = createCacheKey(cacheKey || tableName, conditions);
  
  const query = useSupabaseQuery<TableRow<T>[]>(
    conditions ? key : null,
    async (supabase) => {
      let queryBuilder = supabase
        .from(tableName)
        .select(defaultSelect);
      
      // 조건 적용
      if (conditions) {
        Object.entries(conditions).forEach(([field, value]) => {
          if (value !== undefined && value !== null) {
            queryBuilder = queryBuilder.eq(field, value);
          }
        });
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) throw error;
      
      const result = data || [];
      return transformData ? transformData(result) : result as TableRow<T>[];
    }
  );

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}