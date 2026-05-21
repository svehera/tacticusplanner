import { Rank, Rarity } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui/get-image-url';

import { ICharacter2 } from '@/fsd/4-entities/character';

interface ChipProps {
    character: ICharacter2;
    size?: number;
}

const RANK_TIERS = ['stone', 'iron', 'bronze', 'silver', 'gold', 'diamond'];
const RARITY_NAMES: Record<Rarity, string> = {
    [Rarity.Common]: 'common',
    [Rarity.Uncommon]: 'uncommon',
    [Rarity.Rare]: 'rare',
    [Rarity.Epic]: 'epic',
    [Rarity.Legendary]: 'legendary',
    [Rarity.Mythic]: 'mythic',
};

const getRankImageUrl = (rank: Rank): string | undefined => {
    if (!rank || rank < 1) return undefined;
    const index = rank - 1;
    const tier = Math.floor(index / 3);
    const level = (index % 3) + 1;
    const tierName = RANK_TIERS[tier];
    if (tierName) {
        return getImageUrl(`ranks/${tierName}${level}.png`);
    }
    // adamantine (tier 6, ranks 19-21)
    const adamLevel = index - 18; // 1, 2, 3
    if (adamLevel >= 1 && adamLevel <= 3) {
        return getImageUrl(`snowprint_assets/ranks/ui_icon_rank_mythical_0${adamLevel}.png`);
    }
    return undefined;
};

export const CharacterChip = ({ character, size = 44 }: ChipProps) => {
    const rarityName = RARITY_NAMES[character.rarity] ?? 'common';
    const rankImageUrl = getRankImageUrl(character.rank);
    const badgeSize = Math.round(size * 0.45);

    return (
        <span
            className="relative inline-block shrink-0 rounded"
            style={{
                width: size,
                height: size,
                outline: `1.5px solid var(--rarity-${rarityName})`,
                outlineOffset: '-1px',
            }}>
            <img
                src={getImageUrl(character.roundIcon)}
                alt={character.name}
                width={size}
                height={size}
                className="pointer-events-none block h-full w-full rounded object-cover"
            />
            {rankImageUrl && (
                <img
                    src={rankImageUrl}
                    alt=""
                    aria-hidden
                    width={badgeSize}
                    height={badgeSize}
                    className="pointer-events-none absolute"
                    style={{
                        left: -Math.round(badgeSize * 0.25),
                        bottom: -Math.round(badgeSize * 0.25),
                        width: badgeSize,
                        height: badgeSize,
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
                    }}
                />
            )}
        </span>
    );
};

interface RowProps {
    characters: ICharacter2[];
    gap?: number;
    size?: number;
}

export const CharacterChipRow = ({ characters, gap = 4, size = 44 }: RowProps) => (
    <div className="flex flex-wrap items-center" style={{ gap }}>
        {characters.map(c => (
            <CharacterChip key={c.snowprintId} character={c} size={size} />
        ))}
    </div>
);
