import React from 'react';

import { CharacterPortraitImage } from 'src/v2/components/images/character-portrait.image';

import { RarityStars, Rank } from '@/fsd/5-shared/model';
import { MiscIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { RankIcon } from '@/fsd/4-entities/character/ui/rank.icon';

import './character-tile.css';

interface Props {
    onClick?: () => void;
    isMow?: boolean;
}

export const EmptyTile: React.FC<Props> = ({ onClick, isMow = false }) => {
    return (
        <div
            className="character-tile"
            style={{
                cursor: onClick ? 'pointer' : undefined,
            }}
            onClick={onClick ? () => onClick!() : undefined}>
            <StarsIcon stars={RarityStars.None} />
            <div>
                <CharacterPortraitImage icon={'unset.webp'} />

                <div className="abilities" style={{ visibility: 'hidden' }}>
                    <div className="ability-level">1</div>
                    <div className="ability-level">1</div>
                </div>
                <div className="character-level">1</div>
            </div>
            <div className="character-rarity-rank">
                {isMow ? <MiscIcon icon={'mow'} width={22} height={25} /> : <RankIcon rank={Rank.Stone1} />}
            </div>
        </div>
    );
};
