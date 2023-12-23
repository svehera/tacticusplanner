import { Rank, RarityStars } from '../models/enums';
import React from 'react';

const goldStar = 'star.png';
const redStar = 'red star.png';
const blueStar = 'blue star.png';

export const StarsImage = ({ stars }: { stars: RarityStars }) => {
    try {
        // Import image on demand
        if (stars === RarityStars.None) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const image = require(`../assets/images/stars/${blueStar}`);
            return <img style={{ visibility: 'hidden' }} src={image} height={15} />;
        }

        if (stars <= RarityStars.FiveStars) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const image = require(`../assets/images/stars/${goldStar}`);
            const starsImages = [];
            for (let i = 0; i < stars; i++) {
                starsImages.push(<img key={i} style={{ pointerEvents: 'none' }} src={image} height={15} />);
            }
            return <div style={{ display: 'flex' }}>{starsImages}</div>;
        }

        if (stars <= RarityStars.RedFiveStars) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const image = require(`../assets/images/stars/${redStar}`);
            const starsImages = [];
            for (let i = 0; i < stars - 5; i++) {
                starsImages.push(<img key={i} style={{ pointerEvents: 'none' }} src={image} height={15} />);
            }
            return <div style={{ display: 'flex' }}>{starsImages}</div>;
        }

        if (stars === RarityStars.BlueStar) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const image = require(`../assets/images/stars/${blueStar}`);
            return <img style={{ pointerEvents: 'none' }} src={image} height={15} />;
        }

        return <span>Error</span>;
    } catch (error) {
        // console.log(`Image with name "${Rank[rank]}" does not exist`);
        return <span>Error</span>;
    }
};
