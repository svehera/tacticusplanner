import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharacterPortraitImage } from '@/shared-components/images/character-portrait.image';

import { RarityStars, Rank } from '@/fsd/5-shared/model';
import { MiscIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RankIcon } from '@/fsd/4-entities/character/ui/rank.icon';

interface Props {
    onClick?: () => void;
    isMow?: boolean;
}

export const EmptyTile: React.FC<Props> = ({ onClick, isMow = false }) => {
    return (
        <div
            className="flex min-w-[75px] flex-col items-center"
            style={{
                cursor: onClick ? 'pointer' : undefined,
            }}
            onClick={onClick ? () => onClick!() : undefined}>
            <StarsIcon stars={RarityStars.None} />
            <div>
                <CharacterPortraitImage icon={'portraits/unset.webp'} />

                <div className="[visibility:hidden] relative top-[-7px] z-10 flex items-center justify-between">
                    <div className="relative top-[-15px] flex items-center justify-center border border-solid border-[gold] bg-[#012a41] text-xs text-[white]">
                        1
                    </div>
                    <div className="relative top-[-15px] flex items-center justify-center border border-solid border-[gold] bg-[#012a41] text-xs text-[white]">
                        1
                    </div>
                </div>
                <div className="relative top-[-15px] flex items-center justify-center border border-solid border-[gold] bg-[#012a41] text-xs text-[white]">
                    1
                </div>
            </div>
            <div className="mt-[-15px] flex min-h-[30px] items-center justify-center">
                {isMow ? <MiscIcon icon={'mow'} width={22} height={25} /> : <RankIcon rank={Rank.Stone1} />}
            </div>
        </div>
    );
};
