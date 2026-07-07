import { useSearchParams } from 'react-router-dom';

import { getSeasonConfig, getSeasonIds } from '@/fsd/4-entities/guild_boss';

import { SeasonSelector, TierRow } from '@/fsd/3-features/guild-boss-reference';

export function GuildBossReference() {
    const [searchParams, setSearchParameters] = useSearchParams();
    const seasonIds = getSeasonIds();
    const seasonId = searchParams.get('season') ?? seasonIds[0];

    const config = getSeasonConfig(seasonId);

    function handleSeasonChange(id: string) {
        setSearchParameters({ season: id });
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-(--fg)">Guild Raid Season</h1>
                <SeasonSelector value={seasonId} onChange={handleSeasonChange} />
            </div>
            {config ? (
                <div className="flex flex-col gap-6">
                    {config.tiers
                        .toSorted((a, b) => b.tier - a.tier)
                        .map(tierData => (
                            <TierRow
                                key={tierData.tier}
                                tier={tierData.tier}
                                sets={tierData.sets}
                                seasonId={seasonId}
                            />
                        ))}
                </div>
            ) : (
                <p className="text-(--fg-muted)">Season config not found.</p>
            )}
        </div>
    );
}
