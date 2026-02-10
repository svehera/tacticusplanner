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
                    <th className="text-xs text-stone-600">Killzone </th>
                    <th className="pl-1 text-xs text-stone-600 sm:pl-0">Waves</th>
                    <th className="pl-1 text-xs text-stone-600 sm:pl-0">Enemies</th>
                    <th className="pl-1 text-xs text-stone-600 sm:pl-0">XP</th>
                    <th className="pl-1 text-xs text-stone-600 sm:pl-0">Badges</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(killzones)
                    .map(([name, killzone]) => {
                        return (
                            <>
                                <tr key={name} className="border-t border-stone-200/10">
                                    <td className="pr text-left text-xs sm:text-sm">{name.replace('KillZone ', '')}</td>
                                    <td className="text-center text-xs sm:text-left sm:text-sm">{killzone.waves}</td>
                                    <td className="text-center text-xs sm:text-left sm:text-sm">
                                        {killzone.totalEnemyCount}
                                    </td>
                                    <td className="text-center text-xs sm:text-left sm:text-sm">{killzone.totalXp}</td>
                                    <td className="pl-2 text-xs sm:pl-0 sm:text-sm">
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
