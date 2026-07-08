import { useNavigate } from 'react-router-dom';

import { getImageUrl } from '@/fsd/5-shared/ui/get-image-url';

import {
    bossPortraitMap,
    getUnitDisplayName,
    getUnitSetId,
    resolvePrimeDisplayName,
    resolvePrimePortraitPath,
} from '@/fsd/4-entities/guild_boss';

interface BossCardProps {
    rawUnitId: string;
    seasonId: string;
    tier: number;
    set: number;
    encounterIndex: number;
    isBoss: boolean;
}

export function BossCard({ rawUnitId, seasonId, tier, set, encounterIndex, isBoss }: BossCardProps) {
    const navigate = useNavigate();
    const unitSetId = getUnitSetId(rawUnitId);
    const portraitPath = isBoss
        ? (bossPortraitMap[unitSetId] ?? resolvePrimePortraitPath(unitSetId))
        : resolvePrimePortraitPath(unitSetId);
    const label = isBoss
        ? getUnitDisplayName(unitSetId)
        : (resolvePrimeDisplayName(unitSetId) ?? getUnitDisplayName(unitSetId));

    function handleClick() {
        const params = new URLSearchParams({
            unit: rawUnitId,
            season: seasonId,
            tier: String(tier),
            set: String(set),
            encounter: String(encounterIndex),
        });
        navigate(`/learn/guildBossDetail?${params.toString()}`);
    }

    if (isBoss) {
        return (
            <button
                type="button"
                onClick={handleClick}
                className="group flex flex-col items-center gap-2 rounded-lg border border-(--border) bg-(--bg-secondary) p-2 transition-colors hover:border-(--primary) hover:bg-(--bg-primary) focus-visible:outline-2 focus-visible:outline-(--primary)">
                {portraitPath ? (
                    <img
                        src={getImageUrl(portraitPath)}
                        alt={label}
                        className="h-52 w-36 rounded object-cover object-top"
                    />
                ) : (
                    <div className="flex h-52 w-36 items-center justify-center rounded bg-(--bg-tertiary) text-sm text-(--fg-muted)">
                        {label}
                    </div>
                )}
                <span className="text-center text-sm font-semibold text-(--fg)">{label}</span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className="group flex w-20 flex-col items-center gap-1 rounded-lg border border-(--border) bg-(--bg-secondary) p-2 transition-colors hover:border-(--primary) hover:bg-(--bg-primary) focus-visible:outline-2 focus-visible:outline-(--primary)">
            {portraitPath ? (
                <img src={getImageUrl(portraitPath)} alt={label} className="size-14 rounded-full object-cover" />
            ) : (
                <div className="flex size-14 items-center justify-center rounded-full bg-(--bg-tertiary) text-xs text-(--fg-muted)">
                    ?
                </div>
            )}
            <span className="text-center text-xs text-(--fg-muted)">{label}</span>
        </button>
    );
}
