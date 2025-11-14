// eslint-disable-next-line import-x/no-internal-modules
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';
import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { milestonesAndPoints } from './token-estimation-service';

/**
 * Displays the already-met points milestones of the event.
 */
export const LeTokenMilestones = ({ currentPoints }: { currentPoints: number }) => {
    function getRowData() {
        return milestonesAndPoints.filter(milestone => currentPoints >= milestone.points);
    }

    const rowData = getRowData();

    return rowData.length === 0 ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">No milestones achieved yet.</div>
    ) : (
        <div className="flex flex-wrap gap-3 justify-center w-full">
            {rowData.map((milestone, index) => {
                const isFinalMilestone =
                    milestone.points >= milestonesAndPoints[milestonesAndPoints.length - 1]?.points;

                return (
                    <div
                        key={index}
                        className="p-3 w-40 flex flex-col items-center rounded-lg shadow-md 
                                   bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                                   transition duration-150 ease-in-out hover:shadow-lg">
                        <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Points</div>
                        <div className="text-xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mb-2">
                            {milestone.points}
                        </div>

                        <div className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Reward</div>
                        <div className="flex justify-center items-center h-full text-lg font-bold">
                            {isFinalMilestone ? (
                                <span className="text-green-500 dark:text-green-400">100%</span>
                            ) : (
                                <>
                                    {milestone.stars == 7 ? (
                                        <RarityIcon rarity={Rarity.Mythic} />
                                    ) : (
                                        <StarsIcon stars={milestone.stars + 5 - (milestone.stars >= 7 ? 1 : 0)} />
                                    )}
                                </>
                            )}
                        </div>

                        <div className="mt-3 text-center">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                Round {milestone.round}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {milestone.packsPerRound == 2
                                    ? ' (Both Packs)'
                                    : milestone.packsPerRound == 1
                                      ? ' (Premium)'
                                      : ' (Free)'}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
