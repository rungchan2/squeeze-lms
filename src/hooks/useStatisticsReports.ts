import useSWR, { mutate } from 'swr';
import { useSupabaseAuth } from './useSupabaseAuth';
import {
  getStatisticsReports,
  getStatisticsReport,
  createStatisticsReport,
  updateStatisticsReport,
  deleteStatisticsReport,
  getUserStatisticsReports,
} from '@/utils/data/statistics-reports';
import {
  StatisticsReport,
  CreateStatisticsReport,
  UpdateStatisticsReport,
} from '@/types/statistics-report';

// Hook to fetch all reports for a journey
export function useStatisticsReports(journeyId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    journeyId ? `/statistics-reports/journey/${journeyId}` : null,
    () => getStatisticsReports(journeyId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    reports: data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook to fetch a single report
export function useStatisticsReport(reportId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    reportId ? `/statistics-reports/${reportId}` : null,
    () => getStatisticsReport(reportId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    report: data,
    isLoading,
    error,
    mutate,
  };
}

// Hook to fetch user's reports
export function useUserStatisticsReports() {
  const { user } = useSupabaseAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    user ? `/statistics-reports/user/${user.id}` : null,
    () => getUserStatisticsReports(user!.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    reports: data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook with mutations for CRUD operations
export function useStatisticsReportsCRUD(journeyId: string | null) {
  const { user } = useSupabaseAuth();
  const { reports, isLoading, error, mutate: mutateReports } = useStatisticsReports(journeyId);

  const createReport = async (reportData: Omit<CreateStatisticsReport, 'journey_id'>) => {
    if (!user || !journeyId) {
      throw new Error('User not authenticated or journey not selected');
    }

    try {
      const newReport = await createStatisticsReport(
        {
          ...reportData,
          journey_id: journeyId,
        },
        user.id
      );

      // Optimistically update the cache
      await mutateReports([newReport, ...reports], false);
      
      // Revalidate to ensure consistency
      await mutateReports();

      return newReport;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  };

  const updateReport = async (reportId: string, updates: UpdateStatisticsReport) => {
    try {
      const updatedReport = await updateStatisticsReport(reportId, updates);

      // Optimistically update the cache
      const updatedReports = reports.map(r => 
        r.id === reportId ? updatedReport : r
      );
      await mutateReports(updatedReports, false);
      
      // Revalidate to ensure consistency
      await mutateReports();

      return updatedReport;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      await deleteStatisticsReport(reportId);

      // Optimistically update the cache
      const filteredReports = reports.filter(r => r.id !== reportId);
      await mutateReports(filteredReports, false);
      
      // Revalidate to ensure consistency
      await mutateReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  };

  return {
    reports,
    isLoading,
    error,
    createReport,
    updateReport,
    deleteReport,
    mutateReports,
  };
}