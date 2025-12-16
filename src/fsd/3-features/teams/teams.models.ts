import { v4 } from 'uuid';

import { Rarity } from '@/fsd/5-shared/model';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GameMode } from '@/fsd/3-features/teams/teams.enums';

export interface IPersonalTeam {
    id: string;
    name: string;
    rarityCap: Rarity;
    lineup: string[];
    primaryGameMode: GameMode;
    subModes: string[];
    mowId: string | undefined;

    notes: string;
}

export class PersonalTeam implements IPersonalTeam {
    id: string = v4();
    constructor(
        public primaryGameMode: GameMode,
        public subModes: string[],
        public name: string,
        public notes: string,
        public rarityCap: Rarity,
        public lineup: string[],
        public mowId: string | undefined
    ) {}
}
