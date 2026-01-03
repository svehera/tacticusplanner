import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Button from '@mui/material/Button';
import { sum } from 'lodash';
import { Grid2x2Check, Info } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { isMobile } from 'react-device-detect';

import { getCompletionRateColor } from '@/fsd/5-shared/lib';
import { AccessibleTooltip, ConfirmationDialog } from '@/fsd/5-shared/ui';

import { LegendaryEventEnum, LreReqImage, LreTrackId } from '@/fsd/4-entities/lre';

import { RequirementStatus, ILreTeam } from '@/fsd/3-features/lre';
import { ProgressState } from '@/fsd/3-features/lre-progress';

import { LreTrackBattleSummary } from './le-track-battle';
import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreTrackProgress } from './lre.models';

interface Props {
    track: ILreTrackProgress;
    legendaryEventId: LegendaryEventEnum;
    teams: ILreTeam[];
    toggleBattleState: (
        trackId: LreTrackId,
        battleIndex: number,
        reqId: string,
        state: ProgressState,
        forceOverwrite?: boolean
    ) => void;
}

export const LreTrackOverallProgress: React.FC<Props> = ({
    track,
    legendaryEventId: _legendaryEventId,
    teams,
    toggleBattleState,
}) => {
    // Calculate which restrictions are projected to be cleared for each battle
    const projectedRestrictions = useMemo(() => {
        const battleRestrictions = new Map<number, Set<string>>();

        teams
            .filter(team => team.section === track.trackId)
            .forEach(team => {
                const clears = team.expectedBattleClears ?? 0;
                // For each battle this team is expected to clear
                for (let battleIndex = 0; battleIndex < clears && battleIndex < track.battles.length; battleIndex++) {
                    if (!battleRestrictions.has(battleIndex)) {
                        battleRestrictions.set(battleIndex, new Set());
                    }
                    // Add all restrictions this team can clear
                    team.restrictionsIds.forEach(restrictionId => {
                        battleRestrictions.get(battleIndex)!.add(restrictionId);
                    });
                }
            });

        return battleRestrictions;
    }, [teams, track.trackId, track.battles.length]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const currentPoints = sum(
        track.battles
            .flatMap(x => x.requirementsProgress)
            .map(req => LreRequirementStatusService.getRequirementPoints(req))
    );

    const getReqProgress = (reqId: string) => {
        return track.battles
            .flatMap(x => x.requirementsProgress)
            .filter(x => {
                if (x.id !== reqId) return false;
                if (x.status !== undefined) {
                    return x.status === RequirementStatus.Cleared;
                }
                return x.completed;
            }).length;
    };

    const getReqProgressPoints = (reqId: string) => {
        return sum(
            track.battles
                .flatMap(x => x.requirementsProgress)
                .filter(x => x.id === reqId)
                .map(req => LreRequirementStatusService.getRequirementPoints(req))
        );
    };

    const completionPercentage = Math.round((currentPoints / track.totalPoints) * 100);

    const handleOpenConfirmDialog = () => {
        setConfirmDialogOpen(true);
    };

    const handleCloseConfirmDialog = () => {
        setConfirmDialogOpen(false);
    };

    const handleConfirmToggleAll = () => {
        setConfirmDialogOpen(false);
        setAll();
    };

    const setAll = () => {
        const completedBattles = track.battles
            .map(battle => battle.requirementsProgress.filter(req => req.completed).length)
            .reduce((a, b) => a + b, 0);
        const state =
            completedBattles === track.requirements.length * track.battles.length
                ? ProgressState.none
                : ProgressState.completed;

        track.battles.forEach(battle => {
            battle.requirementsProgress.forEach(req => {
                toggleBattleState(track.trackId, battle.battleIndex, req.id, state, true);
            });
        });
    };

    return (
        <div className="box-border flex flex-col w-full mx-auto md:w-fit md:max-w-full">
            <h3>
                {completionPercentage}% {track.trackName}
            </h3>
            <div className="box-border flex flex-col start gap5">
                {track.requirements.map(req => (
                    <div key={req.id} className="flex-box gap5">
                        <div
                            className="w-[15px] h-[15px] rounded-[50px]"
                            style={{
                                backgroundColor: getCompletionRateColor(getReqProgress(req.id), track.battles.length),
                            }}
                        />
                        <span className="font-bold min-w-[50px]">
                            {getReqProgress(req.id)}/{track.battles.length}
                        </span>

                        <span className="font-bold min-w-20">
                            {getReqProgressPoints(req.id)}/{req.totalPoints}
                        </span>
                        <LreReqImage iconId={req.iconId} />
                        <span className="min-w-[25px] p-1 md:p-1.5">{req.pointsPerBattle || 'x'}</span>
                        <span>{req.name}</span>
                    </div>
                ))}
            </div>
            <Accordion
                defaultExpanded={!isMobile}
                className="mt-2"
                sx={{
                    width: '100%',
                    padding: '0px !important',
                }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <span className="pe-[5px]">Battles Progress</span>
                    <span className="font-bold">
                        {currentPoints}/{track.totalPoints}
                    </span>
                </AccordionSummary>
                <AccordionDetails
                    sx={{
                        padding: '3px !important',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                    }}>
                    <div className="flex-box gap5 column pb-2.5">
                        <Button size="medium" variant="text" onClick={handleOpenConfirmDialog}>
                            <Grid2x2Check className="size-5 md:size-6" />
                        </Button>
                    </div>
                    <div className="flex-col w-full">
                        <div className="flex flex-row w-full mb-1">
                            <div className="flex items-center justify-center shrink-0 mr-0 min-w-8 md:min-w-10 md:mr-1.5">
                                <AccessibleTooltip title="Click on a battle number to mark all objectives complete">
                                    <Info className={isMobile ? 'size-5' : 'size-6'} />
                                </AccessibleTooltip>
                            </div>
                            <div className="flex flex-row justify-between flex-1">
                                {(() => {
                                    const firstRestrictionIndex = LreRequirementStatusService.getFirstRestrictionIndex(
                                        track.requirements
                                    );
                                    return track.requirements.map((req, index) => (
                                        <div
                                            key={req.id}
                                            className={`flex items-center justify-center ${index === firstRestrictionIndex ? 'ml-4' : ''}`}>
                                            <LreReqImage
                                                iconId={req.iconId}
                                                tooltip={req.name}
                                                sizePx={isMobile ? 25 : 30}
                                            />
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                        {track.battles.map(battle => (
                            <LreTrackBattleSummary
                                key={battle.battleIndex}
                                battle={battle}
                                maxKillPoints={track.battlesPoints[battle.battleIndex]}
                                projectedRestrictions={projectedRestrictions.get(battle.battleIndex) ?? new Set()}
                                toggleState={(req, state, forceOverwrite) =>
                                    toggleBattleState(track.trackId, battle.battleIndex, req.id, state, forceOverwrite)
                                }
                            />
                        ))}
                    </div>
                </AccordionDetails>
            </Accordion>

            <ConfirmationDialog
                open={confirmDialogOpen}
                title="Confirm Action"
                message="Are you sure you want to toggle all battles?"
                onConfirm={handleConfirmToggleAll}
                onCancel={handleCloseConfirmDialog}
            />
        </div>
    );
};
