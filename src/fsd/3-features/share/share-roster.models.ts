import { IPersonalCharacterData2 } from 'src/models/interfaces';

import { IMowDb } from '@/fsd/3-features/characters/characters.models';

export interface ICharactersResponse {
    username: string;
    characters: IPersonalCharacterData2[];
    mows: Array<IMowDb>;
}

export interface IShareTokenResponse {
    username: string;
    shareToken: string;
}
