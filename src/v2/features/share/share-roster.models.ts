import { IPersonalCharacterData2 } from 'src/models/interfaces';

export interface ICharactersResponse {
    username: string;
    characters: IPersonalCharacterData2[];
}
