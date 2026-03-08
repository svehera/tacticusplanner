/* eslint-disable import-x/no-internal-modules */

import { Badge, Tooltip } from '@mui/material';
import React from 'react';

import { RarityMapper, Alliance, Rarity } from '@/fsd/5-shared/model';
import { OrbIcon } from '@/fsd/5-shared/ui/icons/orb-image';

interface Props {
    alliance: Alliance;
    orbs: Record<Rarity, number>;
    // TODO: BadgesTotal uses 'small' | 'medium', unify these types across the app
    size?: number;
    displayOrbs?: Record<string, number>; // Optional: if provided, use this for display instead of the full backend record
}

export const OrbsTotal: React.FC<Props> = ({ orbs, alliance, size = 35, displayOrbs }) => {
    const entries = displayOrbs ? Object.entries(displayOrbs) : Object.entries(orbs);
    return (
        <div className="flex-box gap20">
            {entries.map(([rarity, count]) => {
                const rarityNum = Number(rarity) as Rarity;
                return (
                    <Tooltip key={rarityNum} title={`${RarityMapper.rarityToRarityString(rarityNum)} Orb`}>
                        <Badge badgeContent={<b>{count}</b>}>
                            <OrbIcon alliance={alliance} rarity={rarityNum} size={size} />
                        </Badge>
                    </Tooltip>
                );
            })}
        </div>
    );
};
