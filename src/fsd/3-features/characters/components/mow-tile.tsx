import { Tooltip } from '@mui/material';
import { orderBy } from 'lodash';
import React, { useContext } from 'react';

import { charsUnlockShards } from 'src/models/constants';
import { CharacterPortraitImage } from 'src/v2/components/images/character-portrait.image';

import { numberToThousandsStringOld } from '@/fsd/5-shared/lib';
import { AccessibleTooltip, Conditional } from '@/fsd/5-shared/ui';
import { MiscIcon, RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { IMow2 } from '@/fsd/4-entities/mow';
import { CharactersPowerService } from '@/fsd/4-entities/unit';

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
            className="flex flex-col items-center min-w-[75px]"
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
                    className="relative top-[-7px] flex items-center justify-between z-10"
                    style={{ visibility: hasAbilities && viewContext.showAbilitiesLevel ? 'visible' : 'hidden' }}>
                    <div className="relative top-[-16px] w-5 h-5 flex items-center justify-center bg-[#012a41] border text-[white] text-xs border-solid border-[gold] rounded-full">
                        {mow.primaryAbilityLevel}
                    </div>
                    <div className="relative top-[-16px] w-5 h-5 flex items-center justify-center bg-[#012a41] border text-[white] text-xs border-solid border-[gold] rounded-full">
                        {mow.secondaryAbilityLevel}
                    </div>
                </div>
                <Conditional condition={viewContext.showCharacterLevel}>
                    {mow.unlocked ? (
                        <div className="relative top-[-24px] flex items-center justify-center bg-[#012a41] border text-[white] text-xs border-solid border-[gold]">
                            {mow.shards}
                        </div>
                    ) : (
                        <div
                            className="relative top-[-23px] flex items-center justify-center bg-[#012a41] border text-[white] text-xs border-solid border-[gold]"
                            style={{
                                background: `linear-gradient(to right, green ${unlockProgress}%, #012A41 ${unlockProgress}%)`,
                            }}>
                            {`${mow.shards}/${unlockShards}`}
                        </div>
                    )}
                </Conditional>
            </div>
            <div className="min-h-[30px] flex items-center mt-[-19px] justify-center">
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
                        className="w-[60px] flex items-center justify-center bg-[#012a41] border text-[white] text-xs mb-[5px] border-solid border-[gold]"
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
