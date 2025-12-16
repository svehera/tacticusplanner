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
            className="flex flex-col items-center min-w-[75px]"
            style={{
                cursor: onClick ? 'pointer' : undefined,
            }}
            onClick={onClick ? () => onClick!() : undefined}>
            <StarsIcon stars={RarityStars.None} />
            <div>
                <CharacterPortraitImage icon={'portraits/unset.webp'} />

                <div className="relative top-[-7px] flex items-center justify-between z-10 [visibility:hidden]">
                    <div className="relative top-[-15px] flex items-center justify-center bg-[#012a41] border text-[white] text-xs border-solid border-[gold]">
                        1
                    </div>
                    <div className="relative top-[-15px] flex items-center justify-center bg-[#012a41] border text-[white] text-xs border-solid border-[gold]">
                        1
                    </div>
                </div>
                <div className="relative top-[-15px] flex items-center justify-center bg-[#012a41] border text-[white] text-xs border-solid border-[gold]">
                    1
                </div>
            </div>
            <div className="min-h-[30px] flex items-center mt-[-15px] justify-center">
                {isMow ? <MiscIcon icon={'mow'} width={22} height={25} /> : <RankIcon rank={Rank.Stone1} />}
            </div>
        </div>
    );
};
