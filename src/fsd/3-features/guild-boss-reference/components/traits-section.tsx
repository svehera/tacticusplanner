import { formatAbilityName } from '@/fsd/4-entities/guild_boss';

interface TraitsSectionProps {
    traits: string[];
}

export function TraitsSection({ traits }: TraitsSectionProps) {
    if (traits.length === 0) return;

    return (
        <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-(--fg-muted) uppercase">Traits</h3>
            <div className="flex flex-wrap gap-2">
                {traits.map(trait => (
                    <span
                        key={trait}
                        className="rounded-full border border-(--border) bg-(--bg-secondary) px-3 py-0.5 text-xs text-(--fg)">
                        {formatAbilityName(trait)}
                    </span>
                ))}
            </div>
        </div>
    );
}
