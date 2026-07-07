import { formatAbilityName } from '@/fsd/4-entities/guild_boss';

interface AbilitiesSectionProps {
    activeAbilities?: string[];
    passiveAbilities?: string[];
    relicAbilities?: string[];
}

function AbilityList({ title, abilities }: { title: string; abilities: string[] }) {
    if (abilities.length === 0) return;
    return (
        <div>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-(--fg-muted) uppercase">{title}</h4>
            <ul className="flex flex-col gap-1">
                {abilities.map(ability => (
                    <li key={ability} className="text-sm text-(--fg)">
                        {formatAbilityName(ability)}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function AbilitiesSection({
    activeAbilities = [],
    passiveAbilities = [],
    relicAbilities = [],
}: AbilitiesSectionProps) {
    if (activeAbilities.length === 0 && passiveAbilities.length === 0 && relicAbilities.length === 0) return;

    return (
        <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-(--fg-muted) uppercase">Abilities</h3>
            <div className="flex flex-col gap-3 rounded border border-(--border) bg-(--bg-secondary) p-3">
                <AbilityList title="Active" abilities={activeAbilities} />
                <AbilityList title="Passive" abilities={passiveAbilities} />
                <AbilityList title="Relic" abilities={relicAbilities} />
            </div>
        </div>
    );
}
