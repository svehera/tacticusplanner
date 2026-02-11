import { Tooltip } from '@mui/material';
import { orderBy } from 'lodash';
import React, { useContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharacterPortraitImage } from '@/shared-components/images/character-portrait.image';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { charsUnlockShards } from 'src/models/constants';

import { numberToThousandsStringOld } from '@/fsd/5-shared/lib';
import { AccessibleTooltip, Conditional } from '@/fsd/5-shared/ui';
import { MiscIcon, RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { IMow2 } from '@/fsd/4-entities/mow';
import { CharactersPowerService } from '@/fsd/4-entities/unit';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersViewContext } from '@/fsd/3-features/characters/characters-view.context';

interface Props {
    mow: IMow2;
    onClick?: (mow: IMow2) => void;
    disableClick?: boolean;
}

export const MowTile: React.FC<Props> = ({ mow, disableClick, onClick }) => {
    const viewContext = useContext(CharactersViewContext);

    const unlockShards = charsUnlockShards[mow.rarity];
    const unlockProgress = (mow.shards / unlockShards) * 100;
    const hasAbilities = mow.unlocked && (mow.primaryAbilityLevel || mow.secondaryAbilityLevel);

    return (
        <div
            className="flex min-w-[75px] flex-col items-center"
            style={{
                opacity: viewContext.getOpacity ? viewContext.getOpacity(mow) : mow.unlocked ? 1 : 0.5,
                cursor: onClick && !disableClick ? 'pointer' : undefined,
            }}
            onClick={onClick && !disableClick ? () => onClick!(mow) : undefined}>
            <StarsIcon stars={mow.stars} />
            <div>
                <Tooltip
                    placement={'top'}
                    title={
                        <span>
                            {mow.name}
                            <br />
                            Power: {numberToThousandsStringOld(CharactersPowerService.getCharacterAbilityPower(mow))}
                        </span>
                    }>
                    <div>
                        <CharacterPortraitImage icon={mow.icon} />
                    </div>
                </Tooltip>

                <div
                    className="relative top-[-7px] z-10 flex items-center justify-between"
                    style={{ visibility: hasAbilities && viewContext.showAbilitiesLevel ? 'visible' : 'hidden' }}>
                    <div className="relative top-[-16px] flex h-5 w-5 items-center justify-center rounded-full border border-solid border-[gold] bg-[#012a41] text-xs text-[white]">
                        {mow.primaryAbilityLevel}
                    </div>
                    <div className="relative top-[-16px] flex h-5 w-5 items-center justify-center rounded-full border border-solid border-[gold] bg-[#012a41] text-xs text-[white]">
                        {mow.secondaryAbilityLevel}
                    </div>
                </div>
                <Conditional condition={viewContext.showCharacterLevel}>
                    {mow.unlocked ? (
                        <div className="relative top-[-24px] flex items-center justify-center border border-solid border-[gold] bg-[#012a41] text-xs text-[white]">
                            {mow.shards}
                        </div>
                    ) : (
                        <div
                            className="relative top-[-23px] flex items-center justify-center border border-solid border-[gold] bg-[#012a41] text-xs text-[white]"
                            style={{
                                background: `linear-gradient(to right, green ${unlockProgress}%, #012A41 ${unlockProgress}%)`,
                            }}>
                            {`${mow.shards}/${unlockShards}`}
                        </div>
                    )}
                </Conditional>
            </div>
            <div className="mt-[-19px] flex min-h-[30px] items-center justify-center">
                {viewContext.showCharacterRarity && <RarityIcon rarity={mow.rarity} />}
                <MiscIcon icon={'mow'} width={22} height={25} />
            </div>
            {!!mow.numberOfUnlocked && (
                <AccessibleTooltip
                    title={
                        !mow.statsByOwner?.length ? (
                            `${mow.numberOfUnlocked}% of players unlocked this MoW`
                        ) : (
                            <div>
                                ${mow.numberOfUnlocked}% of players unlocked this MoW:
                                <ul>
                                    {orderBy(
                                        mow.statsByOwner,
                                        x => x.primaryAbilityLevel + x.secondaryAbilityLevel
                                    ).map(x => (
                                        <li key={x.owner}>
                                            {x.owner} P{x.primaryAbilityLevel} S{x.secondaryAbilityLevel}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    }>
                    <div
                        className="mb-[5px] flex w-[60px] items-center justify-center border border-solid border-[gold] bg-[#012a41] text-xs text-[white]"
                        style={{
                            background: `linear-gradient(to right, green ${mow.numberOfUnlocked}%, #012A41 ${mow.numberOfUnlocked}%)`,
                        }}>
                        {`${mow.numberOfUnlocked}%`}
                    </div>
                </AccessibleTooltip>
            )}
        </div>
    );
};
