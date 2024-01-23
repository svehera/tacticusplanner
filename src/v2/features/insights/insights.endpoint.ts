import useApi from 'src/v2/api/useApi.hook';
import { IInsightsResponse } from './insights.models';

export const useGetInsights = () => useApi<IInsightsResponse>('GET', 'Insights');
