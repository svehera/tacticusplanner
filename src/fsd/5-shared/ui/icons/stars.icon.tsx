import { RarityStars } from '@/fsd/5-shared/model';

import { starsIcons } from './iconList';

export const StarsIcon = ({ stars }: { stars: RarityStars }) => {
    if (stars === RarityStars.None) {
        return <img className="[visibility: hidden]" src={starsIcons.blueStar} height={15} width={1} alt="none" />;
    }

    if (stars <= RarityStars.FiveStars) {
        const starsImages = Array.from({ length: stars }, (_, index) => (
            <img
                key={index}
                className="pointer-events-none"
                style={{ marginLeft: index > 0 ? -2 : 0 }}
                src={starsIcons.goldStar}
                height={stars === 5 && index === 2 ? 18 : 12}
                width={stars === 5 && index === 2 ? 18 : 12}
                alt="Gold star"
            />
        ));

        return <div className="flex h-[15px] items-end">{starsImages}</div>;
    }

    if (stars <= RarityStars.RedFiveStars) {
        const starsImages = Array.from({ length: stars - 5 }, (_, index) => (
            <img
                key={index}
                className="pointer-events-none"
                style={{ marginLeft: index > 0 ? -2 : 0 }}
                src={starsIcons.redStar}
                height={stars === 10 && index === 2 ? 18 : 12}
                width={stars === 10 && index === 2 ? 18 : 12}
                alt="Red star"
            />
        ));

        return <div className="flex h-[15px] items-end">{starsImages}</div>;
    }

    if (stars <= RarityStars.ThreeBlueStars) {
        const starsImages = Array.from({ length: stars - 10 }, (_, index) => (
            <img
                key={index}
                className="pointer-events-none"
                style={{ marginLeft: index > 0 ? -2 : 0 }}
                src={starsIcons.blueStar}
                height={stars === 10 && index === 2 ? 18 : 12}
                width={stars === 10 && index === 2 ? 18 : 12}
                alt="Blue Star"
            />
        ));

        return <div className="flex h-[15px] items-end">{starsImages}</div>;
    }

    if (stars === RarityStars.MythicWings) {
        return (
            <img
                className="pointer-events-none"
                src={starsIcons.mythicWings}
                height={15}
                width={50}
                alt="Mythic Wings"
            />
        );
    }

    return <span>Invalid stars</span>;
};
