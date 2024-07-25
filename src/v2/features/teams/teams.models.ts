import { Rarity } from 'src/models/enums';
import { v4 } from 'uuid';
import { GameMode } from 'src/v2/features/teams/teams.enums';

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
