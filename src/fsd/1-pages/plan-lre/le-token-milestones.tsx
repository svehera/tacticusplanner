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

    return getRowData().length === 0 ? (
        <></>
    ) : (
        <table key="le-milestones-table" style={{ paddingLeft: 2, paddingRight: 2 }}>
            <thead>
                <tr>
                    <th className="px-4">Points</th>
                    <th className="px-4">Stars</th>
                    <th className="px-4">Round</th>
                    <th className="px-4">Packs Per Round</th>
                </tr>
            </thead>
            <tbody>
                {getRowData().map((milestone, index) => (
                    <tr key={index}>
                        <td className="px-4 text-right">{milestone.points}</td>
                        <td className="px-4 flex justify-center">
                            {milestone.points >= milestonesAndPoints[milestonesAndPoints.length - 1].points ? (
                                '100%'
                            ) : (
                                <>
                                    {milestone.stars == 7 ? (
                                        <RarityIcon rarity={Rarity.Mythic} />
                                    ) : (
                                        <StarsIcon stars={milestone.stars + 5 - (milestone.stars >= 7 ? 1 : 0)} />
                                    )}
                                </>
                            )}
                        </td>
                        <td className="px-4 text-center">{milestone.round}</td>
                        <td className="px-4 text-center">{milestone.packsPerRound}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
