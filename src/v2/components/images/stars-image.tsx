import React from 'react';
import { RarityStars } from 'src/models/enums';
import goldStar from 'src/assets/images/stars/star.png';
import redStar from 'src/assets/images/stars/red star.png';
import blueStar from 'src/assets/images/stars/blue star.png';

export const StarsImage = ({ stars }: { stars: RarityStars }) => {
    if (stars === RarityStars.None) {
        return <img style={{ visibility: 'hidden' }} src={blueStar} height={15} width={1} alt="none" />;
    }

    if (stars <= RarityStars.FiveStars) {
        const starsImages = Array.from({ length: stars }, (_, index) => (
            <img
                key={index}
                style={{ pointerEvents: 'none', marginLeft: index > 0 ? -2 : 0 }}
                src={goldStar}
                height={stars === 5 && index === 2 ? 18 : 12}
                width={stars === 5 && index === 2 ? 18 : 12}
                alt="Gold star"
            />
        ));

        return <div className="flex items-end h-[15px]">{starsImages}</div>;
    }

    if (stars <= RarityStars.RedFiveStars) {
        const starsImages = Array.from({ length: stars - 5 }, (_, index) => (
            <img
                key={index}
                style={{ pointerEvents: 'none', marginLeft: index > 0 ? -2 : 0 }}
                src={redStar}
                height={stars === 10 && index === 2 ? 18 : 12}
                width={stars === 10 && index === 2 ? 18 : 12}
                alt="Red star"
            />
        ));

        return <div className="flex items-end h-[15px]">{starsImages}</div>;
    }

    if (stars === RarityStars.BlueStar) {
        return <img style={{ pointerEvents: 'none' }} src={blueStar} height={15} width={50} alt="Blue star" />;
    }

    return <span>Invalid stars</span>;
};
