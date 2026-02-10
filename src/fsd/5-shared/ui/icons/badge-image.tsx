import { twMerge } from 'tailwind-merge';

import { Rarity, Alliance } from '@/fsd/5-shared/model';

import { getImageUrl } from '../get-image-url';

export const BadgeImage = ({
    alliance,
    rarity,
    size = 'medium',
    className,
}: {
    // ToDo: have common union types and ditch these enums and string unions
    alliance: Alliance | 'Imperial' | 'Chaos' | 'Xenos';
    rarity: Rarity | 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
    size?: 'small' | 'medium';
    className?: string;
}) => {
    const sizePx = size === 'medium' ? 35 : 25;
    const rarityString = typeof rarity === 'string' ? rarity : Rarity[rarity];
    if (!rarityString) {
        return <span>Invalid rarity</span>;
    }
    const image = getImageUrl(`badges/resized/${alliance.toLowerCase()}-${rarityString.toLowerCase()}.png`);

    return (
        <img
            loading={'lazy'}
            src={image}
            height={sizePx}
            alt={alliance}
            className={twMerge('pointer-events-none', className)}
        />
    );
};
