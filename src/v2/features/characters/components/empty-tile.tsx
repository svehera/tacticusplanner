import React from 'react';

import { Rank, RarityStars } from 'src/models/enums';
import { CharacterPortraitImage } from 'src/v2/components/images/character-portrait.image';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { StarsImage } from 'src/v2/components/images/stars-image';

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
            <StarsImage stars={RarityStars.None} />
            <div>
                <CharacterPortraitImage icon={'unset.webp'} />

                <div className="abilities" style={{ visibility: 'hidden' }}>
                    <div className="ability-level">1</div>
                    <div className="ability-level">1</div>
                </div>
                <div className="character-level">1</div>
            </div>
            <div className="character-rarity-rank">
                {isMow ? <MiscIcon icon={'mow'} width={22} height={25} /> : <RankImage rank={Rank.Stone1} />}
            </div>
        </div>
    );
};
