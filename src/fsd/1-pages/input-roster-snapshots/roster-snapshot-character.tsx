/* eslint-disable import-x/no-internal-modules */
import { Tooltip } from '@mui/material';
import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';
import { starsIcons, tacticusIcons } from '@/fsd/5-shared/ui/icons/iconList';

import { ICharacterData, RankIcon } from '@/fsd/4-entities/character';
import { IMowStatic2 } from '@/fsd/4-entities/mow/model';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ISnapshotCharacter, ISnapshotMachineOfWar } from './models';

function getFrame(isMow: boolean, rarity: number): keyof typeof tacticusIcons {
    if (isMow) {
        switch (rarity) {
            case Rarity.Common:
                return 'mowCommonFrame';
            case Rarity.Uncommon:
                return 'mowUncommonFrame';
            case Rarity.Rare:
                return 'mowRareFrame';
            case Rarity.Epic:
                return 'mowEpicFrame';
            case Rarity.Legendary:
                return 'mowLegendaryFrame';
            case Rarity.Mythic:
                return 'mowMythicFrame';
            default:
                return 'mowCommonFrame';
        }
    }
    switch (rarity) {
        case Rarity.Common:
            return 'commonFrame';
        case Rarity.Uncommon:
            return 'uncommonFrame';
        case Rarity.Rare:
            return 'rareFrame';
        case Rarity.Epic:
            return 'epicFrame';
        case Rarity.Legendary:
            return 'legendaryFrame';
        case Rarity.Mythic:
            return 'mythicFrame';
        default:
            return 'commonFrame';
    }
}

function getStarIcon(stars: number): string {
    if (stars <= 5) return starsIcons.goldStar;
    if (stars <= 10) return starsIcons.redStar;
    if (stars <= 13) return starsIcons.blueStar;
    return starsIcons.mythicWings;
}

function getStarCount(stars: number): number {
    if (stars <= 5) return stars;
    if (stars <= 10) return stars - 5;
    if (stars <= 13) return stars - 10;
    return stars - 13;
}

function getRank(rank: number): Rank {
    if (rank in Rank) {
        return rank as Rank;
    }
    return Rank.Locked;
}

function formatShardCount(count: number): string {
    if (count < 0) return '0';
    if (count < 1000) return count.toString();
    if (count < 10000) return `${Math.floor(count / 1000)}k`;
    return '>10k';
}

interface AbilityBadgeProps {
    value: number;
    positionClasses: string;
}

const AbilityDisplay = ({ value, positionClasses }: AbilityBadgeProps) => {
    return (
        <div
            className={`absolute z-10 flex h-5 w-6 items-center justify-center rounded-full border-[1.5px] border-[#333] bg-gray-100 text-[14px] font-bold text-gray-900 shadow-sm dark:border-white dark:bg-[#272424] dark:text-white ${positionClasses} `}>
            {value}
        </div>
    );
};

const XpLevelDisplay = ({ value, positionClasses }: AbilityBadgeProps) => {
    return (
        <div
            className={`absolute z-10 flex h-5 min-w-[28px] items-center justify-center border-[1.5px] border-[#333] bg-gray-100 px-1 text-[14px] font-bold text-gray-900 shadow-sm dark:border-white dark:bg-[#272424] dark:text-white ${positionClasses} `}>
            {value}
        </div>
    );
};

function getStars(stars: number): string {
    if (stars <= 5) return stars.toString() + ` Star${stars !== 1 ? 's' : ''}`;
    if (stars <= 10) return `${stars - 5} Red Star${stars - 5 !== 1 ? 's' : ''}`;
    if (stars <= 13) return `${stars - 10} Blue Star${stars - 10 !== 1 ? 's' : ''}`;
    return `Mythic Winged`;
}

function getCharTooltip(char: ISnapshotCharacter, charData: ICharacterData): React.ReactNode {
    return (
        <>
            {charData.shortName}
            <br />
            Rarity: {Rarity[char.rarity]}
            <br />
            Stars: {getStars(char.stars)}
            <br />
            Rank: {Rank[char.rank]}
            <br />
            Active Ability Level: {char.activeAbilityLevel}
            <br />
            Passive Ability Level: {char.passiveAbilityLevel}
            <br />
            Shards: {char.shards}
            <br />
            Mythic Shards: {char.mythicShards}
            <br />
            XP Level: {char.xpLevel}
        </>
    );
}

function getMowTooltip(mow: ISnapshotMachineOfWar, mowData: IMowStatic2): React.ReactNode {
    return (
        <>
            {mowData.name}
            <br />
            Rarity: {Rarity[mow.rarity]}
            <br />
            Stars: {getStars(mow.stars)}
            <br />
            Active Ability Level: {mow.primaryAbilityLevel}
            <br />
            Passive Ability Level: {mow.secondaryAbilityLevel}
            <br />
            Shards: {mow.shards}
            <br />
            Mythic Shards: {mow.mythicShards}
        </>
    );
}

interface Props {
    showShards: RosterSnapshotShowVariableSettings;
    showMythicShards: RosterSnapshotShowVariableSettings;
    showXpLevel: RosterSnapshotShowVariableSettings;
    showAbilities?: boolean;
    char?: ISnapshotCharacter;
    charData?: ICharacterData;
    mow?: ISnapshotMachineOfWar;
    mowData?: IMowStatic2;
}

export const RosterSnapshotCharacter: React.FC<Props> = ({
    showShards,
    showMythicShards,
    showXpLevel,
    showAbilities = true,
    char,
    charData,
    mow,
    mowData,
}) => {
    const charIcon = getImageUrl(charData?.icon ?? mowData?.icon ?? 'default-character-icon.png');
    const frameIcon = tacticusIcons[getFrame(mow !== undefined, char?.rarity ?? mow?.rarity ?? 0)]?.file || '';
    const starIcon = getStarIcon(char?.stars ?? mow?.stars ?? 0);
    const starCount = getStarCount(char?.stars ?? mow?.stars ?? 0);
    const shardIcon = tacticusIcons.shard.file;
    const mythicShardIcon = tacticusIcons.mythicShard.file;
    const rank = getRank(char?.rank ?? 0);
    const isLocked = rank === Rank.Locked && (mow === undefined || mow.locked);

    const shouldShowShards = () => {
        if (showShards === RosterSnapshotShowVariableSettings.Always) return true;
        if (showShards === RosterSnapshotShowVariableSettings.Never) return false;
        // Auto
        return (char?.shards ?? mow?.shards ?? 0) > 0;
    };

    const shouldShowMythicShards = () => {
        if (showMythicShards === RosterSnapshotShowVariableSettings.Always) return true;
        if (showMythicShards === RosterSnapshotShowVariableSettings.Never) return false;
        // Auto
        return (char?.mythicShards ?? mow?.mythicShards ?? 0) > 0;
    };

    const shouldShowXpLevel = () => {
        if (mow !== undefined) return false;
        if (showXpLevel === RosterSnapshotShowVariableSettings.Always) return true;
        if (showXpLevel === RosterSnapshotShowVariableSettings.Never) return false;
        return (char?.xpLevel ?? 0) > 0;
    };

    return (
        <div className="h-[170px] w-[96px]">
            <Tooltip
                placement="top"
                title={
                    char !== undefined && charData !== undefined
                        ? getCharTooltip(char!, charData!)
                        : mow !== undefined && mowData !== undefined
                          ? getMowTooltip(mow!, mowData!)
                          : ''
                }>
                <div className="absolute h-[170px] w-[96px] justify-center">
                    <img
                        loading="lazy"
                        className={`pointer-events-none absolute top-[17px] left-[3px] z-[1] ${
                            isLocked ? 'grayscale filter' : ''
                        }`}
                        src={charIcon}
                        width={90}
                        height={120}
                        alt={char?.id ?? mow?.id ?? 'character'}
                    />

                    <img src={frameIcon} alt="frame" className="absolute top-[14px] left-0 z-[2] h-[126px] w-[96px]" />

                    {starCount > 0 && !isLocked && (
                        <div className="pointer-events-none absolute top-[-4px] left-0 z-[10] flex h-[32px] w-full items-center justify-center">
                            <div className="flex items-center justify-center -space-x-2">
                                {Array.from({ length: starCount }).map((_, index) => {
                                    const isBigStar = starCount === 5 && index === 2;
                                    return (
                                        <img
                                            key={index}
                                            src={starIcon}
                                            alt="star"
                                            className={`shrink-0 object-contain drop-shadow-[0_0_1px_rgba(0,0,0,1)] drop-shadow-[0_0_2px_rgba(0,0,0,1)] ${
                                                starIcon === starsIcons.mythicWings
                                                    ? 'h-[26px] w-auto'
                                                    : isBigStar
                                                      ? 'h-[30px] w-[30px]'
                                                      : 'h-[24px] w-[24px]'
                                            }`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {showAbilities && (rank !== Rank.Locked || (mow !== undefined && !mow.locked)) && (
                        <>
                            <div className="absolute bottom-[8px] left-0 z-[11] flex w-[36px] justify-center">
                                <div>
                                    <AbilityDisplay
                                        value={char?.activeAbilityLevel ?? mow?.primaryAbilityLevel ?? 0}
                                        positionClasses="relative"
                                    />
                                </div>
                            </div>
                            {shouldShowXpLevel() && (
                                <div className="absolute bottom-[7px] left-1/2 z-[11] flex w-[32px] -translate-x-1/2 justify-center">
                                    <div className="flex w-[36px] justify-center">
                                        <XpLevelDisplay value={char?.xpLevel ?? 0} positionClasses="relative" />
                                    </div>
                                </div>
                            )}
                            <div className="absolute right-0 bottom-[8px] z-[11] flex w-[36px] justify-center">
                                <AbilityDisplay
                                    value={char?.passiveAbilityLevel ?? mow?.secondaryAbilityLevel ?? 0}
                                    positionClasses="relative"
                                />
                            </div>
                        </>
                    )}

                    <div className="pointer-events-none absolute top-[102px] left-[-2px] z-[12]">
                        {rank !== Rank.Locked && <RankIcon rank={rank} size={44} />}
                    </div>

                    <div className="absolute top-[25px] left-[0px] z-[4] flex w-full justify-between px-2">
                        <div className="relative left-[-10px] flex min-w-[30px] items-center justify-center">
                            {shouldShowShards() && (
                                <>
                                    <img src={shardIcon} alt="shards" className="h-[32px] w-auto" />
                                    <span className="pointer-events-none absolute text-[14px] font-bold text-gray-300 [text-shadow:1px_1px_2px_black]">
                                        {formatShardCount(char?.shards ?? mow?.shards ?? 0)}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="relative right-[-10px] flex min-w-[30px] items-center justify-center">
                            {shouldShowMythicShards() && (
                                <>
                                    <img src={mythicShardIcon} alt="mythic shards" className="h-[32px] w-auto" />
                                    <span className="pointer-events-none absolute text-[14px] font-bold text-gray-300 [text-shadow:1px_1px_2px_black]">
                                        {formatShardCount(char?.mythicShards ?? mow?.mythicShards ?? 0)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Tooltip>
        </div>
    );
};
