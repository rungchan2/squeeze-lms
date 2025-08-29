import { createClient } from '@/utils/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';
import { 
  StatisticsReport, 
  CreateStatisticsReport, 
  UpdateStatisticsReport,
  StatisticsReportSchema 
} from '@/types/statistics-report';

type DBStatisticsReport = Tables<'statistics_reports'>;
type DBStatisticsReportInsert = TablesInsert<'statistics_reports'>;
type DBStatisticsReportUpdate = TablesUpdate<'statistics_reports'>;

// Get all reports for a journey
export async function getStatisticsReports(journeyId: string): Promise<StatisticsReport[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('statistics_reports')
    .select('*')
    .eq('journey_id', journeyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching statistics reports:', error);
    throw error;
  }

  return (data || []).map(report => StatisticsReportSchema.parse(report));
}

// Get a single report by ID
export async function getStatisticsReport(reportId: string): Promise<StatisticsReport | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('statistics_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching statistics report:', error);
    throw error;
  }

  return data ? StatisticsReportSchema.parse(data) : null;
}

// Create a new report
export async function createStatisticsReport(
  report: CreateStatisticsReport,
  userId: string
): Promise<StatisticsReport> {
  const supabase = createClient();
  
  const insertData: DBStatisticsReportInsert = {
    journey_id: report.journey_id,
    created_by: userId,
    name: report.name,
    description: report.description || null,
    word_groups: report.word_groups,
    metadata: report.metadata || {},
  };

  const { data, error } = await supabase
    .from('statistics_reports')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating statistics report:', error);
    throw error;
  }

  return StatisticsReportSchema.parse(data);
}

// Update an existing report
export async function updateStatisticsReport(
  reportId: string,
  updates: UpdateStatisticsReport
): Promise<StatisticsReport> {
  const supabase = createClient();
  
  const updateData: DBStatisticsReportUpdate = {
    ...(updates.name && { name: updates.name }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.word_groups && { word_groups: updates.word_groups }),
    ...(updates.metadata && { metadata: updates.metadata }),
  };

  const { data, error } = await supabase
    .from('statistics_reports')
    .update(updateData)
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    console.error('Error updating statistics report:', error);
    throw error;
  }

  return StatisticsReportSchema.parse(data);
}

// Delete a report
export async function deleteStatisticsReport(reportId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('statistics_reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Error deleting statistics report:', error);
    throw error;
  }
}

// Get reports created by a specific user
export async function getUserStatisticsReports(userId: string): Promise<StatisticsReport[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('statistics_reports')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user statistics reports:', error);
    throw error;
  }

  return (data || []).map(report => StatisticsReportSchema.parse(report));
}