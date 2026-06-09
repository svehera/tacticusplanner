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
import { renderRestrictions, renderTeam } from './le-token-render-utilities';
import { LeTokenService } from './le-token-service';
import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreProgressModel, ILreTrackProgress, LeTokenCardRenderMode } from './lre.models';
import { STATUS_LABELS, STATUS_TEXT_CLASSES } from './requirement-status-constants';
import { TokenDisplay } from './token-estimation-service';

interface Props {
    battles: ILeBattles | undefined;
    legendaryEvent: ILegendaryEvent;
    progress: ILreProgressModel;
    tokenDisplays: readonly TokenDisplay[];
    tracksProgress: readonly ILreTrackProgress[];
    createNewModel: (
        model: ILreProgressModel,
        trackId: 'alpha' | 'beta' | 'gamma',
        battleIndex: number,
        requirementId: string,
        status: RequirementStatus,
        forceOverwrite?: boolean
    ) => ILreProgressModel;
    updateDto: (model: ILreProgressModel) => void;
}

const getRowClassName = (index: number) => {
    // Alternate between two sets of colors for striping
    return index % 2 === 0 ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-zinc-200 dark:bg-zinc-900';
};

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
        setBattleVisibility(previous => ({
            ...previous,
            [index]: !previous[index],
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
        if (token.battleNumber == undefined || token.battleNumber < 0) return;

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
        if (token.battleNumber == undefined || token.battleNumber < 0) return;
        setRequirementStatus(token, RequirementStatus.MaybeClear);
    };

    const onStopBattle = (token: TokenDisplay) => {
        if (token.track !== 'alpha' && token.track !== 'beta' && token.track !== 'gamma') return;
        if (token.battleNumber == undefined || token.battleNumber < 0) return;
        setRequirementStatus(token, RequirementStatus.StopHere);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-end rounded-lg border border-(--border) bg-(--soft) p-2">
                <FormControlLabel
                    control={
                        <Switch
                            checked={isTableView}
                            onChange={event => setIsTableView(event.target.checked)}
                            color="primary"
                        />
                    }
                    label={
                        <div className="flex items-center gap-2 text-(--fg)">
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
                <div className="overflow-x-auto rounded-xl border border-(--border) shadow-2xl">
                    <table
                        key="tokensTable"
                        className="min-w-full table-auto border-separate border-spacing-0 bg-(--card) text-sm text-(--card-fg)">
                        <thead>
                            <tr className="sticky top-0 bg-zinc-300 text-zinc-800 uppercase dark:bg-zinc-700 dark:text-zinc-100">
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
                                <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokenDisplays.map((token: TokenDisplay, index: number) => {
                                return (
                                    <tr
                                        key={index}
                                        className={`${getRowClassName(index)} border-t border-(--border) transition duration-150 ease-in-out hover:bg-(--primary)/10`}>
                                        <td className="px-3 py-2 text-center font-medium">{index + 1}</td>
                                        <td className="flex h-full items-center justify-center px-3 py-2">
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
                                        <td className="px-3 py-2 text-right font-mono">{token.battleNumber + 1}</td>
                                        <td className="flex h-full items-center justify-center px-3 py-2">
                                            {renderRestrictions(
                                                token.restricts,
                                                tracksProgress,
                                                token.track as 'alpha' | 'beta' | 'gamma',
                                                token.battleNumber,
                                                25
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono">{token.incrementalPoints}</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-(--primary)">
                                            {token.totalPoints}
                                        </td>
                                        <td className="px-3 py-2 text-center">{renderTeam(token.team, 25)}</td>
                                        <td className="px-3 py-2 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <SyncButton
                                                    showText={false}
                                                    appearance="plain"
                                                    className="-mt-0.5 h-auto !min-h-[auto] !min-w-[auto] self-center !p-0 text-[1.25rem] leading-5 [&_.MuiButton-startIcon]:!m-0 [&_.MuiSvgIcon-root]:align-middle [&_.MuiSvgIcon-root]:[font-size:1.25rem]"
                                                />
                                                <button
                                                    onClick={() => {
                                                        onMaybeBattle(token);
                                                    }}
                                                    className={`text-xs font-semibold uppercase transition-colors duration-500 focus:outline-none disabled:opacity-50 ${STATUS_TEXT_CLASSES[RequirementStatus.MaybeClear]}`}
                                                    title="Potentially will not succeed with this token.">
                                                    {STATUS_LABELS[RequirementStatus.MaybeClear]}{' '}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        onStopBattle(token);
                                                    }}
                                                    className={`text-xs font-semibold uppercase transition-colors duration-500 focus:outline-none disabled:opacity-50 ${STATUS_TEXT_CLASSES[RequirementStatus.StopHere]}`}
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
                                        <div className="w-full rounded-xl border border-(--border) p-4 text-center text-(--soft-fg)">
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
