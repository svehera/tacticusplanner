import { useContext } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { Rarity } from '@/fsd/5-shared/model';
import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { milestonesAndPoints } from './token-estimation-service';

interface Props {
    milestonesToList: any[]; // Replace 'any' with your Milestone interface type
    emptyMessage: string;
    isMissedVariant?: boolean; // Optional prop to style missed items differently
}

export const LeTokenMilestoneCardGrid = ({ milestonesToList, emptyMessage, isMissedVariant = false }: Props) => {
    const { viewPreferences } = useContext(StoreContext);
    const isDarkMode = viewPreferences.theme === 'dark';

    const baseCardClasses =
        'p-3 w-40 flex flex-col items-center rounded-lg shadow-md border transition duration-150 ease-in-out hover:shadow-lg';

    const variantClasses = isMissedVariant
        ? isDarkMode
            ? 'bg-gray-800 border-gray-700 opacity-75 grayscale-[30%]'
            : 'bg-gray-50 border-gray-200 opacity-75 grayscale-[30%]'
        : isDarkMode
          ? 'bg-gray-700 border-gray-600'
          : 'bg-gray-100 border-gray-300';

    return milestonesToList.length === 0 ? (
        <div className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{emptyMessage}</div>
    ) : (
        <div className="flex flex-wrap gap-3 justify-center w-full">
            {milestonesToList.map((milestone, index) => {
                const isFinalMilestone =
                    milestone.points >= milestonesAndPoints[milestonesAndPoints.length - 1]?.points;

                return (
                    <div key={index} className={`${baseCardClasses} ${variantClasses}`}>
                        <div
                            className={`text-xs uppercase font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Points
                        </div>
                        <div
                            className={`text-xl font-extrabold font-mono mb-2 ${isMissedVariant ? 'text-gray-500' : isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {milestone.points}
                        </div>

                        <div
                            className={`text-xs uppercase font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Reward
                        </div>
                        <div className="flex justify-center items-center h-full text-lg font-bold">
                            {isFinalMilestone ? (
                                <span
                                    className={
                                        isMissedVariant
                                            ? 'text-gray-500'
                                            : isDarkMode
                                              ? 'text-green-400'
                                              : 'text-green-500'
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
                            <span className={`text-xs font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                Round {milestone.round}
                            </span>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
