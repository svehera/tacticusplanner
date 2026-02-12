import { Rarity } from '@/fsd/5-shared/model';
import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { milestonesAndPoints } from './token-estimation-service';

interface Props {
    milestonesToList: any[]; // Replace 'any' with your Milestone interface type
    emptyMessage: string;
    isMissedVariant?: boolean; // Optional prop to style missed items differently
}

export const LeTokenMilestoneCardGrid = ({ milestonesToList, emptyMessage, isMissedVariant = false }: Props) => {
    const baseCardClasses =
        'p-3 w-40 flex flex-col items-center rounded-lg shadow-md border transition duration-150 ease-in-out hover:shadow-lg';

    const variantClasses = isMissedVariant
        ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75 grayscale-[30%]'
        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';

    return milestonesToList.length === 0 ? (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">{emptyMessage}</div>
    ) : (
        <div className="flex w-full flex-wrap justify-center gap-3">
            {milestonesToList.map((milestone, index) => {
                const isFinalMilestone =
                    milestone.points >= milestonesAndPoints[milestonesAndPoints.length - 1]?.points;

                return (
                    <div key={index} className={`${baseCardClasses} ${variantClasses}`}>
                        <div className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">Points</div>
                        <div
                            className={`mb-2 font-mono text-xl font-extrabold ${isMissedVariant ? 'text-gray-500' : 'text-blue-600 dark:text-blue-400'}`}>
                            {milestone.points}
                        </div>

                        <div className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">Reward</div>
                        <div className="flex h-full items-center justify-center text-lg font-bold">
                            {isFinalMilestone ? (
                                <span
                                    className={
                                        isMissedVariant ? 'text-gray-500' : 'text-green-500 dark:text-green-400'
                                    }>
                                    100%
                                </span>
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
