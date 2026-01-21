import { useContext, useEffect, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

// eslint-disable-next-line import-x/no-internal-modules
import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';

import { ManageTeams } from './manage-teams';

export const War = () => {
    const { characters: unresolvedCharacters, mows: unresolvedMows } = useContext(StoreContext);

    const [chars, setChars] = useState<ICharacter2[]>(() =>
        CharactersService.resolveStoredCharacters(unresolvedCharacters).filter(c => c.rank !== Rank.Locked)
    );
    const [mows, setMows] = useState<IMow2[]>(() =>
        MowsService.resolveAllFromStorage(unresolvedMows).filter(m => m.unlocked)
    );

    useEffect(() => {
        setChars(CharactersService.resolveStoredCharacters(unresolvedCharacters).filter(c => c.rank !== Rank.Locked));
    }, [unresolvedCharacters]);

    useEffect(() => {
        setMows(MowsService.resolveAllFromStorage(unresolvedMows).filter(m => m.unlocked));
    }, [unresolvedMows]);

    return (
        <div className="p-6">
            <ManageTeams chars={chars} mows={mows} />
        </div>
    );
};
