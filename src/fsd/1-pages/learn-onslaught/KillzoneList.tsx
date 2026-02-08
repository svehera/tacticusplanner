import { BadgeRewardIcon } from './BadgeRewardIcon';
import type { OnslaughtSector } from './data';
import { indexToGreekLetter, totalKillzoneXPReward, totalKillzoneBadgeRewards, totalKillzoneEnemyCount } from './utils';

export function KillzoneList({ killzones }: { killzones: OnslaughtSector['killzones'] }) {
    return (
        <div className="flex flex-col gap-2 sm:gap-3">
            {killzones
                .map((killzone, index) => {
                    const waves = Object.entries(killzone);
                    const totalXP = totalKillzoneXPReward(killzone);
                    const badgeSummary = totalKillzoneBadgeRewards(killzone);

                    return (
                        <div key={index}>
                            Killzone {indexToGreekLetter(index)}
                            {waves.length} {waves.length === 1 ? 'wave' : 'waves'}
                            {badgeSummary.map(badge => (
                                <BadgeRewardIcon key={badge} badge={badge} />
                            ))}
                            {totalKillzoneEnemyCount(killzone)} enemies {/* Wave list */}
                            {totalXP} XP
                        </div>
                    );
                })
                .reverse()}
        </div>
    );
}
