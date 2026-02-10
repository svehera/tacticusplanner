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
        <table className="w-full border-collapse text-left">
            <thead>
                <tr>
                    <th className="text-stone-600 text-xs">Killzone </th>
                    <th className="text-stone-600 text-xs pl-1 sm:pl-0">Waves</th>
                    <th className="text-stone-600 text-xs pl-1 sm:pl-0">Enemies</th>
                    <th className="text-stone-600 text-xs pl-1 sm:pl-0">XP</th>
                    <th className="text-stone-600 text-xs pl-1 sm:pl-0">Badges</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(killzones)
                    .map(([name, killzone]) => {
                        return (
                            <>
                                <tr key={name} className="border-t border-stone-200/10">
                                    <td className="text-xs sm:text-sm text-left pr">{name.replace('KillZone ', '')}</td>
                                    <td className="text-xs sm:text-sm text-center sm:text-left">{killzone.waves}</td>
                                    <td className="text-xs sm:text-sm text-center sm:text-left">
                                        {killzone.totalEnemyCount}
                                    </td>
                                    <td className="text-xs sm:text-sm text-center sm:text-left">{killzone.totalXp}</td>
                                    <td className="text-xs sm:text-sm pl-2 sm:pl-0">
                                        <BadgeRewards
                                            badgeCountsByRarity={killzone.badgeCountsByRarity}
                                            alliance={badgeAlliance}
                                        />
                                    </td>
                                </tr>
                            </>
                        );
                    })
                    .reverse()}
            </tbody>
        </table>
    );
}
