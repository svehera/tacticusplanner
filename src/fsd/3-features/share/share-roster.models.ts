// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IPersonalCharacterData2 } from 'src/models/interfaces';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
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
