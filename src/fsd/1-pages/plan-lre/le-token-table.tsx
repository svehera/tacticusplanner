/* eslint-disable import-x/no-internal-modules */
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { FormControlLabel, Switch } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { CharactersService } from '@/fsd/4-entities/character';

import { ILreViewSettings } from '@/fsd/3-features/view-settings/model';

import { LeTokenCard } from './le-token-card';
import { renderMilestone, renderRestrictions, renderTeam } from './le-token-render-utils';
import { LeTokenCardRenderMode } from './lre.models';
import { milestonesAndPoints, TokenDisplay, TokenEstimationService, TokenUse } from './token-estimation-service';

/**
 * Displays the tokens to be used by the player in optimal order, along with
 * various statistics about each milestone.
 */
export const LeTokenTable = ({ tokens, currentPoints }: { tokens: TokenUse[]; currentPoints: number }) => {
    const { viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [isTableView, setIsTableView] = useState<boolean>(viewPreferences.tokenomicsTableView);

    useEffect(() => {
        const setting = 'tokenomicsTableView';
        const value = isTableView;
        dispatch.viewPreferences({ type: 'Update', setting: setting as keyof ILreViewSettings, value });
    }, [isTableView, dispatch]);

    const isDark = viewPreferences.theme === 'dark';

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
            const chars = [];
            if (token.team) {
                if (token.team.charSnowprintIds) {
                    chars.push(...token.team.charSnowprintIds);
                } else if (token.team.charactersIds) {
                    chars.push(
                        ...token.team.charactersIds.map(
                            name => CharactersService.resolveCharacter(name)?.snowprintId ?? name
                        )
                    );
                } else {
                    continue;
                }
            }
            ret.push({
                team: chars,
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

    const isDarkMode = viewPreferences.theme === 'dark';

    const getBgColor = (index: number) => {
        const lightBg = ['#f0f0f0', '#e0e0e0'];
        const darkBg = ['#1f2937', '#111827'];
        if (isDarkMode) {
            return darkBg[index % darkBg.length];
        }
        return lightBg[index % lightBg.length];
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end items-center bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                <FormControlLabel
                    control={
                        <Switch
                            checked={isTableView}
                            onChange={event => setIsTableView(event.target.checked)}
                            color="primary" // Or your theme color
                        />
                    }
                    label={
                        <div className="flex items-center gap-2 text-gray-300">
                            {isTableView ? (
                                <>
                                    <TableRowsIcon fontSize="small" /> <span>Table View</span>
                                </>
                            ) : (
                                <>
                                    <GridViewIcon fontSize="small" /> <span>Cards View</span>
                                </>
                            )}
                        </div>
                    }
                />
            </div>

            {isTableView ? (
                <div className="overflow-x-auto rounded-xl shadow-2xl border border-gray-700/50">
                    <table
                        key="tokensTable"
                        className="min-w-full table-auto border-separate border-spacing-0 bg-gray-900 text-sm text-gray-200">
                        <thead>
                            <tr className="bg-gray-700 text-gray-100 uppercase sticky top-0">
                                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Token</th>
                                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                                    Milestone
                                    <br />
                                    Achieved
                                </th>
                                <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Track</th>
                                <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Battle</th>
                                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                                    Restrictions
                                    <br />
                                    Cleared
                                </th>
                                <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">
                                    Incremental
                                    <br />
                                    Points
                                </th>
                                <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Total Points</th>
                                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Team</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rowData.map((token: TokenDisplay, index: number) => {
                                return (
                                    <tr
                                        key={index}
                                        style={{ backgroundColor: getBgColor(index) }}
                                        className="border-t border-gray-700/50 hover:bg-gray-700 transition duration-150 ease-in-out">
                                        <td className="px-3 py-2 text-center font-medium">{index + 1}</td>
                                        <td className="px-3 py-2 flex justify-center items-center h-full">
                                            {renderMilestone(token.milestoneAchievedIndex, isDark)}
                                        </td>
                                        <td className="px-3 py-2">{token.track}</td>
                                        <td className="px-3 py-2 text-right font-mono">{token.battleNumber + 1}</td>
                                        <td className="px-3 py-2 h-full flex items-center justify-center">
                                            {renderRestrictions(token.restricts, token.track, token.battleNumber, 25)}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono">{token.incrementalPoints}</td>
                                        <td className="px-3 py-2 text-right font-bold font-mono text-blue-400">
                                            {token.totalPoints}
                                        </td>
                                        <td className="px-3 py-2 text-center">{renderTeam(token.team, 25)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-wrap gap-4 justify-center">
                    {rowData.map((token, index) => (
                        <LeTokenCard
                            key={index}
                            index={index}
                            renderMode={LeTokenCardRenderMode.kInGrid}
                            token={token}
                            renderMilestone={x => renderMilestone(x, isDark)}
                            renderRestrictions={x => renderRestrictions(x, token.track, token.battleNumber, 35)}
                            renderTeam={x => renderTeam(x, 35)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
