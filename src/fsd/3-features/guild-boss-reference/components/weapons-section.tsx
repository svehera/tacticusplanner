import { isRangedWeapon } from '@/fsd/4-entities/guild_boss';
import type { GuildBossWeapon } from '@/fsd/4-entities/guild_boss';

interface WeaponsSectionProps {
    weapons: GuildBossWeapon[];
}

export function WeaponsSection({ weapons }: WeaponsSectionProps) {
    if (weapons.length === 0) return;

    return (
        <div>
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-(--fg-muted) uppercase">Attacks</h3>
            <div className="flex flex-col gap-2">
                {weapons.map((weapon, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-3 rounded border border-(--border) bg-(--bg-secondary) px-3 py-2 text-sm">
                        <span className="font-medium text-(--fg)">{weapon.DamageProfile}</span>
                        <span className="text-(--fg-muted)">
                            {weapon.hits}× hit{weapon.hits === 1 ? '' : 's'}
                        </span>
                        <span className="ml-auto rounded-full bg-(--bg-tertiary) px-2 py-0.5 text-xs text-(--fg-muted)">
                            {isRangedWeapon(weapon) ? `Range ${weapon.Range}` : 'Melee'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
