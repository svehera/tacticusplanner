import { BadgeRewards } from './BadgeRewards';
import type { OnslaughtBadgeAlliance, OnslaughtKillzones } from './types';

export function KillzoneList({
    killzones,
    badgeAlliance,
}: {
    killzones: OnslaughtKillzones;
    badgeAlliance: OnslaughtBadgeAlliance;
}) {
    return (
        <table className="w-full border-collapse">
            <thead>
                <tr className="text-center text-xs text-stone-500 *:px-0.5 sm:text-left">
                    <th className="text-left">Killzone </th>
                    <th>Waves</th>
                    <th>Enemies</th>
                    <th>XP</th>
                    <th className="pl-2 sm:pl-0">Badges</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(killzones)
                    .reverse() // To match the order shown in-game
                    .map(([name, killzone]) => {
                        return (
                            <tr
                                key={name}
                                className="border-t border-stone-300 text-center sm:text-left dark:border-stone-700">
                                <td className="text-left">{name.replace('KillZone ', '')}</td>
                                <td>{killzone.waves}</td>
                                <td>{killzone.totalEnemyCount}</td>
                                <td>{killzone.totalXp}</td>
                                <td className="pl-2 text-left sm:pl-0">
                                    <BadgeRewards
                                        badgeCountsByRarity={killzone.badgeCountsByRarity}
                                        alliance={badgeAlliance}
                                    />
                                </td>
                            </tr>
                        );
                    })}
            </tbody>
        </table>
    );
}
