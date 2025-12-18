/* eslint-disable import-x/no-internal-modules */
import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';

import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';
import { starsIcons, tacticusIcons } from '@/fsd/5-shared/ui/icons/assets';

import { ICharacterData, RankIcon } from '@/fsd/4-entities/character';
import { IMowStatic2 } from '@/fsd/4-entities/mow/model';

import { ISnapshotCharacter, ISnapshotMachineOfWar } from './models';

interface Props {
    char?: ISnapshotCharacter;
    charData?: ICharacterData;
    mow?: ISnapshotMachineOfWar;
    mowData?: IMowStatic2;
}

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
            className={`
            absolute w-6 h-3 rounded-full flex items-center justify-center 
            text-[11px] font-bold z-10 shadow-sm border-[1.5px]
            dark:bg-[#272424] dark:text-white border-[#333]
            bg-gray-100 text-gray-900 dark:border-white
            ${positionClasses}
        `}>
            {value}
        </div>
    );
};

export const RosterSnapshotCharacter: React.FC<Props> = ({ char, charData, mow, mowData }) => {
    const charIcon = getImageUrl(charData?.icon ?? mowData?.icon ?? 'default-character-icon.png');
    const frameIcon = tacticusIcons[getFrame(mow !== undefined, char?.rarity ?? mow?.rarity ?? 0)]?.file || '';
    const starIcon = getStarIcon(char?.stars ?? mow?.stars ?? 0);
    const starCount = getStarCount(char?.stars ?? mow?.stars ?? 0);
    const shardIcon = tacticusIcons.shard.file;
    const mythicShardIcon = tacticusIcons.mythicShard.file;
    const rank = getRank(char?.rank ?? 0);

    return (
        <div className="relative w-[96px] h-[170px]">
            <img
                loading="lazy"
                className="pointer-events-none absolute left-[3px] top-[17px]"
                src={charIcon}
                width={90}
                height={120}
                alt={char?.id ?? mow?.id ?? 'character'}
                onError={_ => console.error('❌ Icon failed', charIcon)}
            />

            <img src={frameIcon} alt="frame" className="absolute top-[14px] left-0 w-[96px] h-[126px] z-[2]" />

            {starCount > 0 && (
                <div className="absolute top-[4px] left-0 w-full flex justify-center z-[3]">
                    <div className="flex items-center justify-center -space-x-1">
                        {/* -space-x-1 is the Tailwind way to do negative margins safely */}
                        {Array.from({ length: starCount }).map((_, index) => {
                            const isBigStar =
                                starCount === 5 &&
                                (starIcon === starsIcons.goldStar || starIcon === starsIcons.redStar) &&
                                index === 2;

                            return (
                                <img
                                    key={index}
                                    src={starIcon}
                                    alt="star"
                                    className={`shrink-0 object-contain ${
                                        starIcon === starsIcons.mythicWings
                                            ? 'h-[26px] w-auto'
                                            : isBigStar
                                              ? 'w-[32px] h-[32px]'
                                              : 'w-[20px] h-[20px]'
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
            <div className="absolute top-[105px] left-0 w-[96px] pointer-events-none z-[3]">
                {rank !== Rank.Locked && (
                    <div className="flex justify-center mr-[60px]">
                        <RankIcon rank={rank} size={42} />
                    </div>
                )}
            </div>

            {(rank !== Rank.Locked || (mow !== undefined && !mow.locked)) && (
                <>
                    <AbilityDisplay value={char?.active ?? mow?.active ?? 0} positionClasses="-top-[-27px] -left-0" />
                    <AbilityDisplay
                        value={char?.passive ?? mow?.passive ?? 0}
                        positionClasses="-top-[-27px] -right-[30px]"
                    />
                </>
            )}

            <div className="absolute top-[140px] left-[4px] w-[88px] flex justify-between items-center z-[4]">
                <div className="relative left-[15px] flex items-center justify-center">
                    <img src={shardIcon} alt="shards" className="h-[22px] w-auto" />
                    <span className="absolute text-[11px] font-bold text-white [text-shadow:1px_1px_2px_black] pointer-events-none">
                        {formatShardCount(char?.shards ?? mow?.shards ?? 0)}
                    </span>
                </div>

                <div className="relative right-[15px] flex items-center justify-center">
                    <img src={mythicShardIcon} alt="mythic shards" className="h-[22px] w-auto" />
                    <span className="absolute text-[11px] font-bold text-white [text-shadow:1px_1px_2px_black] pointer-events-none">
                        {formatShardCount(char?.mythicShards ?? mow?.mythicShards ?? 0)}
                    </span>
                </div>
            </div>
        </div>
    );
};
