import { Rank } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui';

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

    const image =
        rank >= Rank.Adamantine1
            ? getImageUrl('snowprint_assets/ranks/ui_icon_rank_mythical_0' + (rank - Rank.Adamantine1 + 1) + '.png')
            : resized
              ? getImageUrl(`ranks/resized/${rankTextValue.toLowerCase()}.png`)
              : getImageUrl(`ranks/${rankTextValue.toLowerCase()}.png`);

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
