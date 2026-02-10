import { BadgeImage } from '@/fsd/5-shared/ui/icons';

import { OnslaughtBadgeAlliance, OnslaughtKillzone } from './types';

type BadgeCountsByRarity = OnslaughtKillzone['badgeCountsByRarity'];
type RarityString = keyof BadgeCountsByRarity;

export function BadgeRewards({
    badgeCountsByRarity,
    alliance,
}: {
    badgeCountsByRarity: OnslaughtKillzone['badgeCountsByRarity'];
    alliance: OnslaughtBadgeAlliance;
}) {
    return (
        <span className="items-start inline-flex sm:gap-1">
            {Object.entries(badgeCountsByRarity)
                .filter(([_, count]) => count > 0)
                .map(([rarity, count]) => (
                    // on very small screens, smush the badges until they're touching to save space. On larger screens, add a small gap between them
                    <span key={rarity} className="flex items-start -ml-[4px] sm:ml-0 first:ml-0">
                        {Array(count)
                            .fill(0)
                            .map((_, index) => (
                                <BadgeImage
                                    key={index}
                                    rarity={rarity as RarityString}
                                    alliance={alliance}
                                    size="small"
                                    // give badges of the same rarity a stacked appearance via negative margin
                                    className="-ml-4.5 first:ml-0"
                                />
                            ))}
                    </span>
                ))}
        </span>
    );
}
