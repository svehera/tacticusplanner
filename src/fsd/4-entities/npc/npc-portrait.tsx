/* eslint-disable import-x/no-internal-modules */
import React from 'react';

import blueStar from 'src/assets/images/snowprint_assets/stars/ui_icon_star_legendary_large.png';
import mythicWings from 'src/assets/images/snowprint_assets/stars/ui_icon_star_mythic.png';
import redStar from 'src/assets/images/stars/red star small.png';
import goldStar from 'src/assets/images/stars/star small.png';

import { mapSnowprintAssets } from '@/fsd/5-shared/lib';
import { RarityStars, Rank } from '@/fsd/5-shared/model';

import { RankIcon } from '@/fsd/4-entities/character/@x/npc';

import { NpcService } from './npc-service';

const portraitAssets = import.meta.glob('/src/assets/images/snowprint_assets/characters/ui_image_portrait_*.png', {
    eager: true,
    import: 'default',
});
const portraitMap = mapSnowprintAssets(portraitAssets); // Run at module load time so that the build breaks if the glob is wrong.

interface Props {
    id: string;
    rank: Rank;
    stars: RarityStars;
}

/**
 * @param id The snowprint ID of the NPC.
 * @param rank The rank (e.g. Rank.Stone1). Should never be Rank.Locked.
 * @param stars The number of stars to display. If 0, no stars are displayed.
 * @returns An NPC portrait very similar to what you'd get in game. The portrait
 *          frame is 202(width) x 267(height) pixels. There is some overhang
 *          though. The stars rise above the frame as much as 15 pixels, and the
 *          rank ribbon sticks out to the left as much as 15 pixels, and to the
 *          bottom as much as 7 pixels.
 */
export const NpcPortrait: React.FC<Props> = ({ id, rank, stars }) => {
    // All coordinates here are relative to the top-left corner (0, 0).
    const frameWidth = 202;
    const frameHeight = 267;
    const starSize = 45;
    const fifthStarSize = 52;

    const getNpcPortrait = () => {
        const imageUrl = portraitMap[NpcService.getNpcById(id)?.icon ?? ''];
        return (
            <img
                alt="portrait"
                src={imageUrl}
                width={frameWidth}
                height={frameHeight}
                className="absolute top-0 left-0 z-0"
            />
        );
    };

    const getMythicWings = () => {
        const mythicWingsWidth = 256;
        const mythicWingsHeight = 82;
        const mythicWingsTop = -35;
        return (
            <img
                src={mythicWings}
                className="pointer-events-none absolute left-0 z-2"
                style={{
                    top: mythicWingsTop,
                    width: frameWidth,
                    height: (mythicWingsHeight * frameWidth) / mythicWingsWidth,
                }}
            />
        );
    };

    const getStarImage = (star: string, left: number, top: number, width: number, height: number, zIndex: number) => {
        return (
            <img
                key={left}
                src={star}
                className="pointer-events-none absolute"
                style={{ left, top, width, height, zIndex }}
            />
        );
    };

    const get5Stars = (star: string, top: number, overlap: number) => {
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

    const getStars = () => {
        if (stars === RarityStars.None) return <></>;
        if (stars === RarityStars.MythicWings) return getMythicWings();
        let numStars = stars as number;
        let star = goldStar;
        const overlap = 15;
        const starTop = -25;
        if (numStars > 5) {
            numStars -= 5;
            star = redStar;
        }
        if (numStars > 5) {
            numStars -= 5;
            star = blueStar;
        }
        if (numStars == 5) {
            return get5Stars(star, starTop, overlap);
        }
        if (numStars > 5) {
            star = blueStar;
            numStars -= 5;
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
        const overhang = 15;
        const size = 70;
        const top = frameHeight - size + overhang;
        return (
            <div className="absolute left-[-15px] z-4" style={{ top }}>
                <RankIcon rank={rank} size={size} resized={false} />
            </div>
        );
    };

    return (
        <div style={{ width: frameWidth + 40, height: frameHeight + 40 }}>
            <div className="relative top-5 left-5">
                {getNpcPortrait()}
                {getStars()}
                {getRank()}
            </div>
        </div>
    );
};
