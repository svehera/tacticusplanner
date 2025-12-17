import { starsIcons, tacticusIcons } from '@/fsd/5-shared/ui/icons/assets';
import React from 'react';

import { getImageUrl } from 'src/shared-logic/functions';
import { ISnapshotCharacter, ISnapshotMachineOfWar } from './models';
import { ICharacterData, RankIcon } from '@/fsd/4-entities/character';
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';
import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';
import { IMowStatic2 } from '@/fsd/4-entities/mow/model';

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

export const RosterSnapshotCharacter: React.FC<Props> = ({ char, charData, mow, mowData }) => {
    const charIcon = getImageUrl(charData?.icon ?? mowData?.icon ?? 'default-character-icon.png');
    const frameIcon = tacticusIcons[getFrame(mow !== undefined, char?.rarity ?? mow?.rarity ?? 0)]?.file || '';
    const starIcon = getStarIcon(char?.stars ?? mow?.stars ?? 0);
    const starCount = getStarCount(char?.stars ?? mow?.stars ?? 0);
    const rank = getRank(char?.rank ?? 0);

    console.log('mow: ', mow);

    return (
        <div style={{ position: 'relative', width: 64, height: 93 }}>
            <img
                loading="lazy"
                className="pointer-events-none"
                src={charIcon}
                width={60}
                height={80}
                alt={char?.id ?? mow?.id ?? 'character'}
                style={{ left: 2, top: 11, position: 'absolute' }}
                onError={e => {
                    console.error('❌ Failed to load image:', {
                        icon: charData?.icon ?? mowData?.icon,
                        imagePath: charIcon,
                        resolvedUrl: charIcon,
                        error: e,
                    });
                }}
                onLoad={() => { }}
            />
            <img
                src={frameIcon}
                alt="frame"
                style={{
                    position: 'absolute',
                    width: 64,
                    height: 84,
                    top: 9,
                    left: 0,
                    zIndex: 2,
                }}
            />
            {starCount > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: 2,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 3,
                    }}>
                    {Array.from({ length: starCount }).map((_, index) => {
                        const isBigStar =
                            starCount === 5 &&
                            (starIcon === starsIcons.goldStar || starIcon === starsIcons.redStar) &&
                            index === 2;
                        const size = isBigStar ? 22.5 : 15;

                        return (
                            <img
                                key={index}
                                src={starIcon}
                                alt="star"
                                style={{
                                    ...(starIcon === starsIcons.mythicWings
                                        ? { height: 18.75, width: 'auto' }
                                        : { width: size, height: size }),
                                    marginLeft: index === 0 ? 0 : -4,
                                }}
                            />
                        );
                    })}
                </div>
            )}
            <div
                style={{
                    position: 'absolute',
                    top: 70,
                    left: -50,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 3,
                }}>
                {rank !== Rank.Locked && <RankIcon rank={rank} size={28} />}
            </div>
            {((rank !== Rank.Locked) || (mow !== undefined && !mow.locked)) && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 2,
                        zIndex: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        alignItems: 'center',
                    }}>
                    <div
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            borderRadius: 4,
                            padding: '1px 3px',
                            fontSize: 11,
                            lineHeight: '1',
                        }}>
                        {char !== undefined ? 'A' : 'P'}: {char?.active ?? mow?.active}
                    </div>
                    <div
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            borderRadius: 4,
                            padding: '1px 3px',
                            fontSize: 11,
                            lineHeight: '1',
                        }}>
                        {char !== undefined ? 'P' : 'S'}: {char?.passive ?? mow?.passive}
                    </div>
                </div>
            )}
        </div>
    );
};
