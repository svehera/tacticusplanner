import type { GuildBossStats } from '@/fsd/4-entities/guild_boss';

interface BossStatsTableProps {
    stats: GuildBossStats;
}

function Row({ label, value }: { label: string; value: string | number }) {
    return (
        <tr className="border-b border-(--border) last:border-0">
            <td className="py-1.5 pr-6 text-sm text-(--fg-muted)">{label}</td>
            <td className="py-1.5 text-right text-sm font-medium text-(--fg)">{value}</td>
        </tr>
    );
}

export function BossStatsTable({ stats }: BossStatsTableProps) {
    return (
        <table className="w-full">
            <tbody>
                <Row label="Health" value={stats.Health.toLocaleString()} />
                <Row label="Damage" value={stats.Damage.toLocaleString()} />
                <Row label="Armor" value={stats.FixedArmor.toLocaleString()} />
                {stats.BlockChance !== undefined && <Row label="Block Chance" value={`${stats.BlockChance}%`} />}
                {stats.BlockDamage !== undefined && <Row label="Block Damage" value={`${stats.BlockDamage}%`} />}
                {stats.CritChance !== undefined && <Row label="Crit Chance" value={`${stats.CritChance}%`} />}
                {stats.CritDamage !== undefined && <Row label="Crit Damage" value={`${stats.CritDamage}%`} />}
                <Row label="Ability Level" value={stats.AbilityLevel} />
            </tbody>
        </table>
    );
}
