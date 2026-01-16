/* eslint-disable import-x/no-internal-modules */
import bronze1 from '@/assets/images/ranks/bronze1.png';
import bronze2 from '@/assets/images/ranks/bronze2.png';
import bronze3 from '@/assets/images/ranks/bronze3.png';
import diamond1 from '@/assets/images/ranks/diamond1.png';
import diamond2 from '@/assets/images/ranks/diamond2.png';
import diamond3 from '@/assets/images/ranks/diamond3.png';
import gold1 from '@/assets/images/ranks/gold1.png';
import gold2 from '@/assets/images/ranks/gold2.png';
import gold3 from '@/assets/images/ranks/gold3.png';
import iron1 from '@/assets/images/ranks/iron1.png';
import iron2 from '@/assets/images/ranks/iron2.png';
import iron3 from '@/assets/images/ranks/iron3.png';
import bronze1resized from '@/assets/images/ranks/resized/bronze1.png';
import bronze2resized from '@/assets/images/ranks/resized/bronze2.png';
import bronze3resized from '@/assets/images/ranks/resized/bronze3.png';
import diamond1resized from '@/assets/images/ranks/resized/diamond1.png';
import diamond2resized from '@/assets/images/ranks/resized/diamond2.png';
import diamond3resized from '@/assets/images/ranks/resized/diamond3.png';
import gold1resized from '@/assets/images/ranks/resized/gold1.png';
import gold2resized from '@/assets/images/ranks/resized/gold2.png';
import gold3resized from '@/assets/images/ranks/resized/gold3.png';
import iron1resized from '@/assets/images/ranks/resized/iron1.png';
import iron2resized from '@/assets/images/ranks/resized/iron2.png';
import iron3resized from '@/assets/images/ranks/resized/iron3.png';
import silver1resized from '@/assets/images/ranks/resized/silver1.png';
import silver2resized from '@/assets/images/ranks/resized/silver2.png';
import silver3resized from '@/assets/images/ranks/resized/silver3.png';
import stone1resized from '@/assets/images/ranks/resized/stone1.png';
import stone2resized from '@/assets/images/ranks/resized/stone2.png';
import stone3resized from '@/assets/images/ranks/resized/stone3.png';
import silver1 from '@/assets/images/ranks/silver1.png';
import silver2 from '@/assets/images/ranks/silver2.png';
import silver3 from '@/assets/images/ranks/silver3.png';
import stone1 from '@/assets/images/ranks/stone1.png';
import stone2 from '@/assets/images/ranks/stone2.png';
import stone3 from '@/assets/images/ranks/stone3.png';
import mythical1 from '@/assets/images/snowprint_assets/ranks/ui_icon_rank_mythical_01.png';
import mythical2 from '@/assets/images/snowprint_assets/ranks/ui_icon_rank_mythical_02.png';
import mythical3 from '@/assets/images/snowprint_assets/ranks/ui_icon_rank_mythical_03.png';
/* eslint-enable import-x/no-internal-modules */

import { Rank } from '@/fsd/5-shared/model';

const rankIcons = {
    [Rank.Bronze1]: { standard: bronze1, resized: bronze1resized },
    [Rank.Bronze2]: { standard: bronze2, resized: bronze2resized },
    [Rank.Bronze3]: { standard: bronze3, resized: bronze3resized },
    [Rank.Diamond1]: { standard: diamond1, resized: diamond1resized },
    [Rank.Diamond2]: { standard: diamond2, resized: diamond2resized },
    [Rank.Diamond3]: { standard: diamond3, resized: diamond3resized },
    [Rank.Gold1]: { standard: gold1, resized: gold1resized },
    [Rank.Gold2]: { standard: gold2, resized: gold2resized },
    [Rank.Gold3]: { standard: gold3, resized: gold3resized },
    [Rank.Iron1]: { standard: iron1, resized: iron1resized },
    [Rank.Iron2]: { standard: iron2, resized: iron2resized },
    [Rank.Iron3]: { standard: iron3, resized: iron3resized },
    [Rank.Silver1]: { standard: silver1, resized: silver1resized },
    [Rank.Silver2]: { standard: silver2, resized: silver2resized },
    [Rank.Silver3]: { standard: silver3, resized: silver3resized },
    [Rank.Stone1]: { standard: stone1, resized: stone1resized },
    [Rank.Stone2]: { standard: stone2, resized: stone2resized },
    [Rank.Stone3]: { standard: stone3, resized: stone3resized },
    [Rank.Adamantine1]: { standard: mythical1, resized: mythical1 }, // resized icons not available for mythic
    [Rank.Adamantine2]: { standard: mythical2, resized: mythical2 }, // resized icons not available for mythic
    [Rank.Adamantine3]: { standard: mythical3, resized: mythical3 }, // resized icons not available for mythic
} as const;

export const RankIcon = ({
    rank,
    rankPoint5,
    size = 30,
    resized = false,
}: {
    rank: Rank;
    rankPoint5?: boolean;
    size?: number;
    resized?: boolean;
}) => {
    if (!rank || rank > Rank.Adamantine3) {
        return <span>{Rank[Rank.Locked]}</span>;
    }

    const rankTextValue = Rank[rank];

    const image = resized ? rankIcons[rank].resized : rankIcons[rank].standard;

    return (
        <>
            <img
                loading={'lazy'}
                className="pointer-events-none w-auto h-auto"
                style={{ maxWidth: size, maxHeight: size }}
                src={image}
                alt={rankTextValue}
            />
            {rankPoint5 && '.5'}
        </>
    );
};
