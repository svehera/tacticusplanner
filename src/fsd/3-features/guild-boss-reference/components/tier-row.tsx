import { RarityString } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import type { GuildBossEncounter, GuildBossSet } from '@/fsd/4-entities/guild_boss';
import { getSetPrimeEncounters, getTierRarity } from '@/fsd/4-entities/guild_boss';

import { BossCard } from './boss-card';

interface TierRowProps {
    tier: number;
    sets: GuildBossSet[];
    seasonId: string;
}

const RARITY_COLOURS: Record<number, string> = {
    0: 'text-(--rarity-common) border-(--rarity-common)',
    1: 'text-(--rarity-uncommon) border-(--rarity-uncommon)',
    2: 'text-(--rarity-rare) border-(--rarity-rare)',
    3: 'text-(--rarity-epic) border-(--rarity-epic)',
    4: 'text-(--rarity-legendary) border-(--rarity-legendary)',
    5: 'text-(--rarity-mythic) border-(--rarity-mythic)',
};

const RARITY_NAMES = [
    RarityString.Common,
    RarityString.Uncommon,
    RarityString.Rare,
    RarityString.Epic,
    RarityString.Legendary,
    RarityString.Mythic,
];

// Crystal[0], Boss, Crystal[1] — the encounter display order per set
function orderEncounters(encounters: GuildBossEncounter[]): GuildBossEncounter[] {
    const boss = encounters.find(enc => enc.guildBossEncounterType === 'Boss');
    const primes = getSetPrimeEncounters(encounters);
    return [primes[0], boss, primes[1]].filter((enc): enc is GuildBossEncounter => enc !== undefined);
}

export function TierRow({ tier, sets, seasonId }: TierRowProps) {
    const colours = RARITY_COLOURS[tier] ?? 'text-(--fg) border-(--border)';
    const rarityName = RARITY_NAMES[tier] ?? `Tier ${tier}`;
    const rarity = getTierRarity(tier);
    const [colourText, colourBorder] = colours.split(' ');

    return (
        <section className={`rounded-lg border ${colourBorder} bg-(--bg-primary) p-4`}>
            <h2 className={`mb-4 flex items-center gap-2 text-lg font-bold ${colourText}`}>
                <RarityIcon rarity={rarity} />
                {rarityName}
            </h2>
            <div className="flex flex-col gap-6">
                {sets
                    .toSorted((a, b) => b.set - a.set)
                    .map(bossSet => {
                        const ordered = orderEncounters(bossSet.encounters);
                        if (ordered.length === 0) return;

                        return (
                            <div key={bossSet.set} className="flex gap-4 overflow-x-auto">
                                {ordered.map(enc => (
                                    <div key={enc.encounterIndex} className="flex shrink-0 flex-col items-center gap-1">
                                        <BossCard
                                            rawUnitId={enc.unitId}
                                            seasonId={seasonId}
                                            tier={tier}
                                            set={bossSet.set}
                                            encounterIndex={enc.encounterIndex}
                                            isBoss={enc.guildBossEncounterType === 'Boss'}
                                        />
                                    </div>
                                ))}
                            </div>
                        );
                    })}
            </div>
        </section>
    );
}
