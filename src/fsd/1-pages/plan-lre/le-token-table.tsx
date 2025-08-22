import React, { useContext, useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { StarsIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { LreReqImage } from '@/fsd/4-entities/lre';

import { ILreRequirements } from './lre.models';
import { milestonesAndPoints, TokenEstimationService, TokenUse } from './token-estimation-service';

class TokenDisplay {
    public team: string[] = [];
    public restricts: ILreRequirements[] = [];
    public battleNumber: number = -1;
    public track: string = '(null track)';
    public incrementalPoints: number = -1;
    public totalPoints: number = -1;
    public milestoneAchievedIndex: number = -1;
}

/**
 * Displays the tokens to be used by the player in optimal order, along with
 * various statistics about each milestone.
 */
export const LeTokenTable = ({ tokens, currentPoints }: { tokens: TokenUse[]; currentPoints: number }) => {
    const rowData = useMemo(() => {
        let totalPoints = currentPoints;
        const ret: TokenDisplay[] = [];
        let currentMilestoneIndex: number = TokenEstimationService.getFurthestMilestoneAchieved(totalPoints) + 1;
        for (let i = 0; i < tokens.length; ++i) {
            const token = tokens[i];
            totalPoints += token.incrementalPoints;
            let milestoneIndex = -1;
            if (
                currentMilestoneIndex < milestonesAndPoints.length &&
                totalPoints >= milestonesAndPoints[currentMilestoneIndex].points
            ) {
                milestoneIndex = currentMilestoneIndex;
                currentMilestoneIndex++;
            }
            ret.push({
                team: token.team!.charactersIds,
                restricts: token.restrictionsCleared,
                battleNumber: token.battleNumber,
                track: token.team!.section,
                incrementalPoints: token.incrementalPoints,
                totalPoints: totalPoints,
                milestoneAchievedIndex: milestoneIndex,
            });
        }
        return ret;
    }, [tokens, currentPoints]);

    const { viewPreferences } = useContext(StoreContext);

    const isDarkMode = viewPreferences.theme === 'dark';

    const getBgColor = (index: number) => {
        const lightBg = ['#f0f0f0', '#e0e0e0'];
        const darkBg = ['#101010', '#202020'];
        if (isDarkMode) {
            return darkBg[index % darkBg.length];
        }
        return lightBg[index % lightBg.length];
    };

    const getTextColor = (severity: number) => {
        const lightText = ['#b00', '#bb0', '#0b0'];
        const darkText = ['#f00', '#ff0', '#0f0'];
        if (isDarkMode) {
            return darkText[severity];
        }
        return lightText[severity];
    };

    const getOrdinal = (num: number) => {
        if (num == 1) return '1st';
        if (num == 2) return '2nd';
        if (num == 3) return '3rd';
        return num + 'th';
    };

    const getMilestone = (milestoneIndex: number) => {
        if (milestoneIndex === -1) {
            return <></>;
        }
        if (milestoneIndex >= milestonesAndPoints.length) {
            return <></>;
        }
        const milestone = milestonesAndPoints[milestoneIndex];
        return (
            <table>
                <tbody>
                    <tr>
                        <td className="flex justify-center items-center">
                            {milestone.points >= 21000 ? <span>100%</span> : <StarsIcon stars={milestone.stars + 5} />}
                        </td>
                    </tr>
                    <tr>
                        <td className="text-center justify-center">
                            <span style={{ color: getTextColor(3 - milestone.round) }}>
                                {getOrdinal(milestone.round)} Round
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td className="text-center justify-center">
                            <span style={{ color: getTextColor(2 - milestone.packsPerRound) }}>
                                {milestone.packsPerRound == 2
                                    ? 'with both packs'
                                    : milestone.packsPerRound == 1
                                      ? 'with premium missions'
                                      : 'with free missions'}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        );
        const ret = [];
        ret.push();
        ret.push();
        if (milestone.packsPerRound == 2) {
            ret.push();
        } else if (milestone.packsPerRound == 1) {
            ret.push(<span className="text-yellow-500">with premium missions</span>);
        } else {
            ret.push(<span className="text-green-500">with free missions</span>);
        }
        return <div key={'milestone' + milestoneIndex}>{ret}</div>;
    };

    return (
        <table key="tokensTable">
            <thead>
                <tr>
                    <th className="px-4">Token</th>
                    <th className="px-4">Milestone Achieved</th>
                    <th className="px-4">Track</th>
                    <th className="px-4">Battle</th>
                    <th className="px-4">Restrictions Cleared</th>
                    <th className="px-4">Incremental Points</th>
                    <th className="px-4">Total Points</th>
                    <th className="px-4">Team</th>
                </tr>
            </thead>
            <tbody>
                {rowData.map((token: TokenDisplay, index: number) => {
                    return (
                        <tr key={index} style={{ backgroundColor: getBgColor(index) }}>
                            <td className="px-4">{index + 1}</td>
                            <td align="center" className="px-4 flex justify-center">
                                {getMilestone(token.milestoneAchievedIndex)}
                            </td>
                            <td className="px-4">{token.track}</td>
                            <td className="px-4 text-right">{token.battleNumber + 1}</td>
                            <td className="px-4 flex justify-center">
                                {token.restricts.map(restrict =>
                                    restrict.id === '_killPoints' || restrict.id === '_highScore' ? (
                                        <span key={token.track + token.battleNumber + restrict.id}> </span>
                                    ) : (
                                        <LreReqImage
                                            key={restrict.iconId + index}
                                            iconId={restrict.iconId}
                                            tooltip={restrict.name}
                                        />
                                    )
                                )}
                            </td>
                            <td className="px-4">{token.incrementalPoints}</td>
                            <td className="px-4 text-right">{token.totalPoints}</td>
                            <td className="px-4">
                                {token.team.map((charId: string) => (
                                    <UnitShardIcon
                                        key={charId + index}
                                        icon={CharactersService.getUnit(charId)?.roundIcon ?? ''}
                                        height={20}
                                        tooltip={charId}
                                    />
                                ))}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};
