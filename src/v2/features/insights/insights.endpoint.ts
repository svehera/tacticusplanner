import { useApi } from '@/fsd/5-shared/api';

import { IInsightsResponse } from './insights.models';

export const useGetInsights = () => useApi<IInsightsResponse>('GET', 'Insights');
