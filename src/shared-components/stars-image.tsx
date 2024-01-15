import { Rank, RarityStars } from '../models/enums';
import React from 'react';
import { getImageUrl } from '../shared-logic/functions';

const goldStar = 'star.png';
const redStar = 'red star.png';
const blueStar = 'blue star.png';

export const StarsImage = ({ stars }: { stars: RarityStars }) => {
    try {
        // Import image on demand
        if (stars === RarityStars.None) {
            const image = getImageUrl(`stars/${blueStar}`);
            return <img style={{ visibility: 'hidden' }} src={image} height={15} />;
        }

        if (stars <= RarityStars.FiveStars) {
            const image = getImageUrl(`stars/${goldStar}`);
            const starsImages = [];
            for (let i = 0; i < stars; i++) {
                starsImages.push(<img key={i} style={{ pointerEvents: 'none' }} src={image} height={15} />);
            }
            return <div style={{ display: 'flex' }}>{starsImages}</div>;
        }

        if (stars <= RarityStars.RedFiveStars) {
            const image = getImageUrl(`stars/${redStar}`);
            const starsImages = [];
            for (let i = 0; i < stars - 5; i++) {
                starsImages.push(<img key={i} style={{ pointerEvents: 'none' }} src={image} height={15} />);
            }
            return <div style={{ display: 'flex' }}>{starsImages}</div>;
        }

        if (stars === RarityStars.BlueStar) {
            const image = getImageUrl(`stars/${blueStar}`);
            return <img style={{ pointerEvents: 'none' }} src={image} height={15} />;
        }

        return <span>Error</span>;
    } catch (error) {
        // console.log(`Image with name "${Rank[rank]}" does not exist`);
        return <span>Error</span>;
    }
};
