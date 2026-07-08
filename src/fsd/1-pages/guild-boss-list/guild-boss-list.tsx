import { useNavigate } from 'react-router-dom';

import { getImageUrl } from '@/fsd/5-shared/ui';

import {
    bossPortraitMap,
    getBossUnitSetIds,
    getPrimeUnitSetIds,
    getUnitDisplayName,
    guildBossData,
    resolvePrimeDisplayName,
    resolvePrimePortraitPath,
} from '@/fsd/4-entities/guild_boss';

function maxProgressionUnitId(unitSetId: string): string {
    const count = guildBossData.unitSets[unitSetId]?.stats.length ?? 1;
    return `${unitSetId}:${count}`;
}

export function GuildBossList() {
    const navigate = useNavigate();
    const bossIds = getBossUnitSetIds();
    const primeIds = getPrimeUnitSetIds();

    function goToUnit(unitSetId: string) {
        const params = new URLSearchParams({ unit: maxProgressionUnitId(unitSetId) });
        navigate(`/learn/guildBossDetail?${params.toString()}`);
    }

    return (
        <div className="flex flex-col gap-8 p-6">
            <h1 className="text-2xl font-bold text-(--fg)">Guild Bosses</h1>

            <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold tracking-wide text-(--fg-muted) uppercase">Bosses</h2>
                <div className="flex flex-wrap gap-3">
                    {bossIds.map(id => {
                        const portraitPath = bossPortraitMap[id] ?? resolvePrimePortraitPath(id);
                        const label = getUnitDisplayName(id);
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => goToUnit(id)}
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
                    })}
                </div>
            </section>

            <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold tracking-wide text-(--fg-muted) uppercase">Primes</h2>
                <div className="flex flex-wrap gap-3">
                    {primeIds.map(id => {
                        const portraitPath = resolvePrimePortraitPath(id);
                        const label = resolvePrimeDisplayName(id) ?? getUnitDisplayName(id);
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => goToUnit(id)}
                                className="group flex w-20 flex-col items-center gap-1 rounded-lg border border-(--border) bg-(--bg-secondary) p-2 transition-colors hover:border-(--primary) hover:bg-(--bg-primary) focus-visible:outline-2 focus-visible:outline-(--primary)">
                                {portraitPath ? (
                                    <img
                                        src={getImageUrl(portraitPath)}
                                        alt={label}
                                        className="size-14 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex size-14 items-center justify-center rounded-full bg-(--bg-tertiary) text-xs text-(--fg-muted)">
                                        ?
                                    </div>
                                )}
                                <span className="text-center text-xs text-(--fg-muted)">{label}</span>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
