// SWR configuration for journey tabs
export const journeyTabSWRConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  shouldRetryOnError: false,
  dedupingInterval: 60000, // 60 seconds
  focusThrottleInterval: 120000, // 2 minutes
  errorRetryCount: 1,
  errorRetryInterval: 5000,
  keepPreviousData: true,
};

// Specific configs for different data types
export const weeksSWRConfig = {
  ...journeyTabSWRConfig,
  refreshInterval: 0, // Disable auto refresh
  dedupingInterval: 300000, // 5 minutes
};

export const missionsSWRConfig = {
  ...journeyTabSWRConfig,
  refreshInterval: 0,
  dedupingInterval: 300000, // 5 minutes
};

export const postsSWRConfig = {
  ...journeyTabSWRConfig,
  refreshInterval: 30000, // 30 seconds for feed
  dedupingInterval: 10000, // 10 seconds
};

export const dashboardSWRConfig = {
  ...journeyTabSWRConfig,
  refreshInterval: 60000, // 1 minute for dashboard
  dedupingInterval: 30000, // 30 seconds
};