import useApi from 'src/v2/api/useApi.hook';
import { ICharactersResponse } from './share-roster.models';

export const useGetSharedRoster = (username: string, shareToken: string) =>
    useApi<ICharactersResponse>('GET', `Characters?username=${username}&shareToken=${shareToken}`);
