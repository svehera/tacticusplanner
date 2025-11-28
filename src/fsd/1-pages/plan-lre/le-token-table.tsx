/* eslint-disable import-x/no-internal-modules */
import CheckIcon from '@mui/icons-material/Check';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { FormControlLabel, IconButton, Switch } from '@mui/material';
import { useContext, useEffect, useState } from 'react';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { ProgressState } from '@/fsd/3-features/lre-progress/enums';
import { ILreViewSettings } from '@/fsd/3-features/view-settings/model';

import { LeBattle } from './le-battle';
import { ILeBattles, LeBattleService } from './le-battle.service';
import { LeTokenCard } from './le-token-card';
import { renderMilestone, renderRestrictions, renderTeam } from './le-token-render-utils';
import { LeTokenCardRenderMode } from './lre.models';
import { TokenDisplay } from './token-estimation-service';

interface Props {
    battles: ILeBattles | undefined;
    tokenDisplays: TokenDisplay[];
    toggleBattleState: (
        trackId: 'alpha' | 'beta' | 'gamma',
        battleIndex: number,
        reqId: string,
        state: ProgressState
    ) => void;
}

/**
 * Displays the tokens to be used by the player in optimal order, along with
 * various statistics about each milestone.
 */
export const LeTokenTable: React.FC<Props> = ({ battles, tokenDisplays, toggleBattleState }: Props) => {
    const { viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [isTableView, setIsTableView] = useState<boolean>(viewPreferences.tokenomicsTableView);
    const [battleVisibility, setBattleVisibility] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const setting = 'tokenomicsTableView';
        const value = isTableView;
        dispatch.viewPreferences({ type: 'Update', setting: setting as keyof ILreViewSettings, value });
    }, [isTableView, dispatch]);

    const onToggleBattle = (index: number) => {
        setBattleVisibility(prev => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const createCompleteBattleHandler = (token: TokenDisplay) => {
        return () => {
            if (token.track !== 'alpha' && token.track !== 'beta' && token.track !== 'gamma') return;

            // Mark only the restrictions included in this token as completed
            for (const restrict of token.restricts) {
                toggleBattleState(
                    token.track as 'alpha' | 'beta' | 'gamma',
                    token.battleNumber,
                    restrict.id,
                    ProgressState.completed
                );
            }
        };
    };

    const isDark = viewPreferences.theme === 'dark';

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
            <div
                className={`flex justify-end items-center ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-200 border-gray-300'} p-2 rounded-lg border`}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={isTableView}
                            onChange={event => setIsTableView(event.target.checked)}
                            color="primary"
                        />
                    }
                    label={
                        <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
                <div
                    className={`overflow-x-auto rounded-xl shadow-2xl border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-300'}`}>
                    <table
                        key="tokensTable"
                        className={`min-w-full table-auto border-separate border-spacing-0 ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'} text-sm`}>
                        <thead>
                            <tr
                                className={`${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-300 text-gray-800'} uppercase sticky top-0`}>
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
                                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                                    Mark
                                    <br />
                                    Complete
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokenDisplays.map((token: TokenDisplay, index: number) => {
                                return (
                                    <tr
                                        key={index}
                                        style={{ backgroundColor: getBgColor(index) }}
                                        className={`border-t ${isDarkMode ? 'border-gray-700/50 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-300'} transition duration-150 ease-in-out`}>
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
                                        <td className="px-3 py-2 text-center">
                                            <IconButton
                                                size="small"
                                                onClick={createCompleteBattleHandler(token)}
                                                sx={{ color: 'gray' }}
                                                title="Mark this battle as completed">
                                                <CheckIcon fontSize="small" />
                                            </IconButton>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
                    {tokenDisplays.map((token, index) => {
                        const isVisible = !!battleVisibility[index];

                        return (
                            <div key={index}>
                                <LeTokenCard
                                    index={index}
                                    renderMode={LeTokenCardRenderMode.kInGrid}
                                    token={token}
                                    renderMilestone={x => renderMilestone(x, isDark)}
                                    renderRestrictions={x => renderRestrictions(x, token.track, token.battleNumber, 35)}
                                    renderTeam={x => renderTeam(x, 30)}
                                    isBattleVisible={isVisible}
                                    onToggleBattle={onToggleBattle}
                                    onCompleteBattle={createCompleteBattleHandler(token)}
                                    isDarkMode={isDark}
                                />

                                {isVisible && LeBattleService.getBattleFromToken(token, battles) ? (
                                    <div className="w-full">
                                        <LeBattle
                                            battle={LeBattleService.getBattleFromToken(token, battles)!}
                                            trackName={token.track}
                                            isDarkMode={isDarkMode}
                                        />
                                    </div>
                                ) : (
                                    isVisible && (
                                        <div
                                            className={`w-full text-center ${isDarkMode ? 'text-gray-500 border-gray-700' : 'text-gray-600 border-gray-300'} p-4 border rounded-xl`}>
                                            Battle data not available.
                                        </div>
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
