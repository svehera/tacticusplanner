import React from 'react';
import { RarityStars } from 'src/models/enums';
import goldStar from 'src/assets/images/stars/star.png';
import redStar from 'src/assets/images/stars/red star.png';
import blueStar from 'src/assets/images/stars/blue star.png';

export const StarsImage = ({ stars }: { stars: RarityStars }) => {
    if (stars === RarityStars.None) {
        return <img style={{ visibility: 'hidden' }} src={blueStar} height={15} alt="none" />;
    }

    if (stars <= RarityStars.FiveStars) {
        const starsImages = Array.from({ length: stars }, (_, index) => (
            <img key={index} style={{ pointerEvents: 'none' }} src={goldStar} height={15} alt="Gold star" />
        ));

        return <div style={{ display: 'flex' }}>{starsImages}</div>;
    }

    if (stars <= RarityStars.RedFiveStars) {
        const starsImages = Array.from({ length: stars - 5 }, (_, index) => (
            <img key={index} style={{ pointerEvents: 'none' }} src={redStar} height={15} alt="Red star" />
        ));

        return <div style={{ display: 'flex' }}>{starsImages}</div>;
    }

    if (stars === RarityStars.BlueStar) {
        return <img style={{ pointerEvents: 'none' }} src={blueStar} height={15} alt="Blue star" />;
    }

    return <span>Invalid stars</span>;
};
