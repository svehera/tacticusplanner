import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ICharacterAbilitiesMaterialsTotal } from '@/fsd/3-features/characters/characters.models';

import { BadgesTotal } from './badges-total';

export const CharacterAbilitiesTotal: React.FC<ICharacterAbilitiesMaterialsTotal> = ({ gold, badges, alliance }) => {
    return (
        <div className="flex-box gap20 wrap">
            <BadgesTotal badges={badges} alliance={alliance} />
            <div className="flex-box gap5">
                <b>{numberToThousandsString(gold)}</b>
                <span>Gold</span>
            </div>
        </div>
    );
};
