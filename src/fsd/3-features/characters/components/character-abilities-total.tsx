/* eslint-disable import-x/no-internal-modules */

import { Tooltip } from '@mui/material';
import React from 'react';

import { numberToThousandsString } from '@/fsd/5-shared/lib/number-to-thousands-string';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacterAbilitiesMaterialsTotal } from '@/fsd/3-features/characters/characters.models';

import { BadgesTotal } from './badges-total';

export const CharacterAbilitiesTotal: React.FC<ICharacterAbilitiesMaterialsTotal> = ({ gold, badges, alliance }) => {
    return (
        <div className="flex-box gap20 wrap">
            <BadgesTotal badges={badges} alliance={alliance} />
            <div className="w-[15px]" />
            <div className="flex-box gap5">
                <Tooltip title="Gold">
                    <span>
                        <MiscIcon icon={'coin'} width={25} height={25} />
                    </span>
                </Tooltip>
                <b>{numberToThousandsString(gold)}</b>
            </div>
        </div>
    );
};
