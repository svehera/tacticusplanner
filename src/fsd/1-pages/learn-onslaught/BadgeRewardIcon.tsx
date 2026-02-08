import { BadgeImage } from '@/fsd/5-shared/ui/icons';

import type { OnslaughtWave } from './data';
import { parseBadge } from './utils';

export function BadgeRewardIcon({ badge }: { badge: OnslaughtWave['badge'] }) {
    const { rarity, alliance, count } = parseBadge(badge);

    return (
        <span>
            {count}x <BadgeImage rarity={rarity} alliance={alliance} size="small" />
        </span>
    );
}
