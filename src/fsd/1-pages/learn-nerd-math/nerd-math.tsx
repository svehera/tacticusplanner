/* eslint-disable import-x/no-internal-modules */
import { useContext, useState } from 'react';

import { StoreContext } from '@/reducers/store.provider';

import { Rank, Rarity } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';

import { AttackerSelect } from './attacker-select';
import { Attacker } from './models';

export const NerdMath = () => {
    const { characters: unresolvedCharacters } = useContext(StoreContext);
    const characters = CharactersService.resolveStoredCharacters(unresolvedCharacters);
    const [attacker, setAttacker] = useState<Attacker>({
        unit: null,
        rarity: Rarity.Common,
        rank: Rank.Stone1,
        equipment: [null, null, null],
        equipmentLevels: [1, 1, 1],
        activeLevel: 1,
        passiveLevel: 1,
    });

    return (
        <div className="flex flex-col gap-3">
            <AttackerSelect attacker={attacker} availableUnits={characters} onAttackerChange={setAttacker} />
        </div>
    );
};
