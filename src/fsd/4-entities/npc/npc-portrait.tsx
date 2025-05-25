/* eslint-disable import-x/no-internal-modules */
import React from 'react';

import blueStar from 'src/assets/images/stars/blue star.png';
import redStar from 'src/assets/images/stars/red star small.png';
import goldStar from 'src/assets/images/stars/star small.png';

import { RarityStars, Rarity, Rank } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui';

import { RankIcon } from '@/fsd/4-entities/character/@x/npc';

import { NpcService } from './npcService';

interface Props {
    name: string;
    rank: Rank;
    rarity: Rarity;
    stars: RarityStars;
}

/**
 *
 * @param name The name of the NPC. Can be a boss, in which case the character
 *        portrait is used and @rarity is considered.
 * @param rank The rank (e.g. Rank.Stone1). Should never be Rank.Locked.
 * @param rarity The rarity of the NPC. Only used if @name is a boss.
 * @param stars The number of stars to display. If 0, no stars are displayed.
 * @returns An NPC portrait very similar to what you'd get in game. The portrait
 *          frame is 202(width) x 267(height) pixels. There is some overhang
 *          though. The stars rise above the frame as much as 15 pixels, and the
 *          rank ribbon sticks out to the left as much as 15 pixels, and to the
 *          bottom as much as 7 pixels.
 */
export const NpcPortrait: React.FC<Props> = ({ name, rank, rarity, stars }) => {
    // All coordinates here are relative to the top-left corner (0, 0).
    const frameWidth = 202;
    const frameHeight = 267;
    const starSize = 45;
    const fifthStarSize = 52;

    const getFrame = (rarity: Rarity) => {
        const icons = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const imageUrl = getImageUrl('rarity_frames/' + icons[rarity as number] + '.png');
        return (
            <img
                src={imageUrl}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: frameWidth,
                    height: frameHeight,
                    zIndex: 1,
                }}
            />
        );
    };

    const getNpcPortrait = (name: string) => {
        const imageUrl = getImageUrl(NpcService.getNpcIconPath(name));
        return (
            <img
                src={imageUrl}
                width={frameWidth}
                height={frameHeight}
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
            />
        );
    };

    const getBlueStar = () => {
        const blueStarWidth = 256;
        const blueStarHeight = 82;
        const blueStarTop = -35;
        return (
            <img
                src={blueStar}
                style={{
                    pointerEvents: 'none',
                    position: 'absolute',
                    left: 0,
                    top: blueStarTop,
                    width: frameWidth,
                    height: (blueStarHeight * frameWidth) / blueStarWidth,
                    zIndex: 2,
                }}
            />
        );
    };

    const getStarImage = (star: string, left: number, top: number, width: number, height: number, zIndex: number) => {
        return (
            <img
                key={left}
                src={star}
                style={{
                    pointerEvents: 'none',
                    position: 'absolute',
                    left: left,
                    top: top,
                    width: width,
                    height: height,
                    zIndex: zIndex,
                }}
            />
        );
    };

    const get5Stars = (star: string, top: number, overlap: number) => {
        const totalWidth = fifthStarSize + (starSize - overlap) * 4;
        let left = frameWidth / 2 - fifthStarSize / 2 - starSize * 2 + overlap * 2;
        const sizeDiff = fifthStarSize - starSize;
        const starImages = [];
        for (let i = 0; i < 5; i++) {
            const size = i == 2 ? fifthStarSize : starSize;
            const topDiff = i == 2 ? -sizeDiff : 0;
            starImages.push(getStarImage(star, left, top + topDiff, size, size, 5 - Math.abs(2 - i)));
            left += size - overlap;
        }
        return <>{starImages}</>;
    };

    const getStars = (stars: RarityStars) => {
        if (stars === RarityStars.None) return <></>;
        if (stars === RarityStars.BlueStar) return getBlueStar();
        let numStars = stars as number;
        let star = goldStar;
        const overlap = 15;
        const starTop = -25;
        if (numStars > 5) {
            numStars -= 5;
            star = redStar;
        }
        if (numStars == 5) {
            return get5Stars(star, starTop, overlap);
        }
        const totalWidth = starSize * numStars - overlap * (numStars - 1);
        let left = frameWidth / 2 - totalWidth / 2;
        let z = 3 + numStars;
        const starImages = [];
        for (let i = 0; i < numStars; i++) {
            starImages.push(getStarImage(star, left, starTop, starSize, starSize, z));
            left += starSize - overlap;
            --z;
        }
        return <>{starImages}</>;
    };

    const getRank = () => {
        const left = -15;
        const overhang = 15;
        const size = 70;
        const top = frameHeight - size + overhang;
        return (
            <div style={{ position: 'absolute', top: top, left: left, zIndex: 4 }}>
                <RankIcon rank={rank} size={size} resized={false} />
            </div>
        );
    };

    return (
        <div style={{ width: frameWidth + 40, height: frameHeight + 40 }}>
            <div style={{ position: 'relative', top: 20, left: 20 }}>
                {getFrame(rarity)}
                {getNpcPortrait(name)}
                {getStars(stars)}
                {getRank()}
            </div>
        </div>
    );
};
