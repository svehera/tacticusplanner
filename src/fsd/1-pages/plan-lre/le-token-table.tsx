/* eslint-disable import-x/no-internal-modules */
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { FormControlLabel, Switch } from '@mui/material';
import { useContext, useEffect, useState } from 'react';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';
import { StarsIcon } from '@/fsd/5-shared/ui/icons/stars.icon';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

import { ILegendaryEvent, RequirementStatus } from '@/fsd/3-features/lre';
import { ILreViewSettings } from '@/fsd/3-features/view-settings/model';

import { LeBattle } from './le-battle';
import { ILeBattles, LeBattleService } from './le-battle.service';
import { LeTokenCard } from './le-token-card';
import { renderRestrictions, renderTeam } from './le-token-render-utils';
import { LeTokenService } from './le-token-service';
import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreProgressModel, ILreTrackProgress, LeTokenCardRenderMode } from './lre.models';
import { STATUS_COLORS, STATUS_LABELS } from './requirement-status-constants';
import { TokenDisplay } from './token-estimation-service';

interface Props {
    battles: ILeBattles | undefined;
    legendaryEvent: ILegendaryEvent;
    progress: ILreProgressModel;
    tokenDisplays: TokenDisplay[];
    tracksProgress: ILreTrackProgress[];
    createNewModel: (
        model: ILreProgressModel,
        trackId: 'alpha' | 'beta' | 'gamma',
        battleIndex: number,
        reqId: string,
        status: RequirementStatus,
        forceOverwrite?: boolean
    ) => ILreProgressModel;
    updateDto: (model: ILreProgressModel) => void;
}

/**
 * Displays the tokens to be used by the player in optimal order, along with
 * various statistics about each milestone.
 */
export const LeTokenTable: React.FC<Props> = ({
    battles,
    legendaryEvent,
    progress,
    tokenDisplays,
    tracksProgress,
    createNewModel,
    updateDto,
}: Props) => {
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

    const getTokenEventIteration = (tokenIndex: number): number => {
        return (
            LeTokenService.getIterationForToken(
                tokenIndex,
                progress.syncedProgress?.currentTokens ?? 0,
                progress.syncedProgress?.hasUsedAdForExtraTokenToday ?? true,
                legendaryEvent,
                progress.occurrenceProgress[0].premiumMissionsProgress > 0,
                progress.occurrenceProgress[1].premiumMissionsProgress > 0,
                progress.occurrenceProgress[2].premiumMissionsProgress > 0,
                Date.now()
            ) ?? 3
        );
    };

    const setRequirementStatus = (token: TokenDisplay, status: RequirementStatus) => {
        if (token.track !== 'alpha' && token.track !== 'beta' && token.track !== 'gamma') return;
        if (token.battleNumber == null || token.battleNumber < 0) return;

        const hasRestrictions = token.restricts.some(r => !LreRequirementStatusService.isDefaultObjective(r.id));
        // Mark the restrictions included in this token as completed
        let leModel = progress;
        let modified = false;
        for (const restrict of token.restricts) {
            if (
                status === RequirementStatus.Cleared ||
                !hasRestrictions ||
                !LreRequirementStatusService.isDefaultObjective(restrict.id)
            ) {
                modified = true;
                leModel = createNewModel(
                    leModel,
                    token.track as 'alpha' | 'beta' | 'gamma',
                    token.battleNumber,
                    restrict.id,
                    status
                );
            }
        }
        if (modified) updateDto(leModel);
    };

    const onMaybeBattle = (token: TokenDisplay) => {
        if (token.track !== 'alpha' && token.track !== 'beta' && token.track !== 'gamma') return;
        if (token.battleNumber == null || token.battleNumber < 0) return;
        setRequirementStatus(token, RequirementStatus.MaybeClear);
    };

    const onStopBattle = (token: TokenDisplay) => {
        if (token.track !== 'alpha' && token.track !== 'beta' && token.track !== 'gamma') return;
        if (token.battleNumber == null || token.battleNumber < 0) return;
        setRequirementStatus(token, RequirementStatus.StopHere);
    };

    const getRowClassName = (index: number) => {
        // Alternate between two sets of colors for striping
        return index % 2 === 0 ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-900';
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-end p-2 bg-gray-200 border border-gray-300 rounded-lg dark:bg-gray-800/50 dark:border-gray-700">
                <FormControlLabel
                    control={
                        <Switch
                            checked={isTableView}
                            onChange={event => setIsTableView(event.target.checked)}
                            color="primary"
                        />
                    }
                    label={
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
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
                <div className="overflow-x-auto border border-gray-300 shadow-2xl rounded-xl dark:border-gray-700/50">
                    <table
                        key="tokensTable"
                        className="min-w-full text-sm text-gray-800 bg-white border-separate table-auto border-spacing-0 dark:bg-gray-900 dark:text-gray-200">
                        <thead>
                            <tr className="sticky top-0 text-gray-800 uppercase bg-gray-300 dark:bg-gray-700 dark:text-gray-100">
                                <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">Token</th>
                                <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">
                                    Milestone
                                    <br />
                                    Achieved
                                </th>
                                <th className="px-3 py-3 font-semibold text-left whitespace-nowrap">Track</th>
                                <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Battle</th>
                                <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">
                                    Restrictions
                                    <br />
                                    Cleared
                                </th>
                                <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">
                                    Incremental
                                    <br />
                                    Points
                                </th>
                                <th className="px-3 py-3 font-semibold text-right whitespace-nowrap">Total Points</th>
                                <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">Team</th>
                                <th className="px-3 py-3 font-semibold text-center whitespace-nowrap">Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokenDisplays.map((token: TokenDisplay, index: number) => {
                                return (
                                    <tr
                                        key={index}
                                        className={`${getRowClassName(index)} border-t border-gray-300 dark:border-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-700 transition duration-150 ease-in-out`}>
                                        <td className="px-3 py-2 font-medium text-center">{index + 1}</td>
                                        <td className="flex items-center justify-center h-full px-3 py-2">
                                            {token.achievedStarMilestone ? (
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <StarsIcon stars={token.stars} />
                                                    <RarityIcon rarity={token.rarity} />
                                                </div>
                                            ) : (
                                                <></>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">{token.track}</td>
                                        <td className="px-3 py-2 font-mono text-right">{token.battleNumber + 1}</td>
                                        <td className="flex items-center justify-center h-full px-3 py-2">
                                            {renderRestrictions(
                                                token.restricts,
                                                tracksProgress,
                                                token.track as 'alpha' | 'beta' | 'gamma',
                                                token.battleNumber,
                                                25
                                            )}
                                        </td>
                                        <td className="px-3 py-2 font-mono text-right">{token.incrementalPoints}</td>
                                        <td className="px-3 py-2 font-mono font-bold text-right text-blue-400">
                                            {token.totalPoints}
                                        </td>
                                        <td className="px-3 py-2 text-center">{renderTeam(token.team, 25)}</td>
                                        <td className="px-3 py-2 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <SyncButton
                                                    showText={false}
                                                    variant="text"
                                                    sx={{
                                                        minWidth: 'auto',
                                                        padding: 0,
                                                        minHeight: 'auto',
                                                        height: 'auto',
                                                        fontSize: '1.25rem',
                                                        lineHeight: '1.25rem',
                                                        alignSelf: 'center',
                                                        marginTop: '-2px',
                                                        '& .MuiButton-startIcon': {
                                                            margin: 0,
                                                        },
                                                        '& .MuiSvgIcon-root': {
                                                            fontSize: '1.25rem',
                                                            verticalAlign: 'middle',
                                                        },
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        onMaybeBattle(token);
                                                    }}
                                                    style={{ color: STATUS_COLORS[RequirementStatus.MaybeClear] }}
                                                    className="text-xs font-semibold uppercase transition-colors duration-500 disabled:opacity-50 focus:outline-none"
                                                    title="Potentially will not succeed with this token.">
                                                    {STATUS_LABELS[RequirementStatus.MaybeClear]}{' '}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        onStopBattle(token);
                                                    }}
                                                    style={{ color: STATUS_COLORS[RequirementStatus.StopHere] }}
                                                    className="text-xs font-semibold uppercase transition-colors duration-500 disabled:opacity-50 focus:outline-none"
                                                    title="Do not attempt this token.">
                                                    {STATUS_LABELS[RequirementStatus.StopHere]}
                                                </button>
                                            </div>
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
                                    tokenUsedDuringEventIteration={getTokenEventIteration(index)}
                                    renderMode={LeTokenCardRenderMode.kInGrid}
                                    token={token}
                                    renderRestrictions={x =>
                                        renderRestrictions(
                                            x,
                                            tracksProgress,
                                            token.track as 'alpha' | 'beta' | 'gamma',
                                            token.battleNumber,
                                            35
                                        )
                                    }
                                    renderTeam={x => renderTeam(x, 30)}
                                    isBattleVisible={isVisible}
                                    onToggleBattle={onToggleBattle}
                                    onMaybeBattle={() => onMaybeBattle(token)}
                                    onStopBattle={() => onStopBattle(token)}
                                />

                                {isVisible && LeBattleService.getBattleFromToken(token, battles) ? (
                                    <div className="w-full">
                                        <LeBattle
                                            battle={LeBattleService.getBattleFromToken(token, battles)!}
                                            trackName={token.track}
                                        />
                                    </div>
                                ) : (
                                    isVisible && (
                                        <div className="w-full p-4 text-center text-gray-600 border border-gray-300 dark:text-gray-500 dark:border-gray-700 rounded-xl">
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
