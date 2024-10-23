import { IPersonalCharacterData2 } from 'src/models/interfaces';
import { IMowDb } from 'src/v2/features/characters/characters.models';

export interface ICharactersResponse {
    username: string;
    characters: IPersonalCharacterData2[];
    mows: Array<IMowDb>;
}
