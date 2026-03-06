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
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

import { LegendaryEventEnum, LreReqImage, LreTrackId } from '@/fsd/4-entities/lre';

import { RequirementStatus, ILreTeam } from '@/fsd/3-features/lre';
import { LrePointsCategoryId } from '@/fsd/3-features/lre-progress';

import { LreTrackBattleSummary } from './le-track-battle';
import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreProgressModel, ILreRequirements, ILreTrackProgress } from './lre.models';

interface Properties {
    track: ILreTrackProgress;
    legendaryEventId: LegendaryEventEnum;
    teams: ILreTeam[];
    model: ILreProgressModel;
    createNewModel: (
        model: ILreProgressModel,
        trackId: LreTrackId,
        battleIndex: number,
        requestId: string,
        status: RequirementStatus,
        forceOverwrite?: boolean
    ) => ILreProgressModel;
    updateDto: (model: ILreProgressModel) => void;
}

const getRestrictionTooltip = (request: ILreRequirements) => {
    if (
        request.id === LrePointsCategoryId.defeatAll ||
        request.id === LrePointsCategoryId.killScore ||
        request.id === LrePointsCategoryId.highScore
    ) {
        return request.name;
    }
    return `${request.name} - ${request.pointsPerBattle}`;
};

export const LreTrackOverallProgress: React.FC<Properties> = ({
    track,
    legendaryEventId: _legendaryEventId,
    teams,
    model,
    createNewModel,
    updateDto,
}) => {
    // Calculate which restrictions are projected to be cleared for each battle
    const projectedRestrictions = useMemo(() => {
        const battleRestrictions = new Map<number, Set<string>>();

        for (const team of teams.filter(team => team.section === track.trackId)) {
            const clears = team.expectedBattleClears ?? 0;
            // For each battle this team is expected to clear
            for (let battleIndex = 0; battleIndex < clears && battleIndex < track.battles.length; battleIndex++) {
                if (!battleRestrictions.has(battleIndex)) {
                    battleRestrictions.set(battleIndex, new Set());
                }
                // Add all restrictions this team can clear
                for (const restrictionId of team.restrictionsIds) {
                    battleRestrictions.get(battleIndex)!.add(restrictionId);
                }
            }
        }

        return battleRestrictions;
    }, [teams, track.trackId, track.battles.length]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const currentPoints = sum(
        track.battles
            .flatMap(x => x.requirementsProgress)
            .map(request => LreRequirementStatusService.getRequirementPoints(request))
    );

    const getRequestProgress = (requestId: string) => {
        return track.battles
            .flatMap(x => x.requirementsProgress)
            .filter(x => {
                if (x.id !== requestId) return false;
                if (x.status !== undefined) {
                    return x.status === RequirementStatus.Cleared;
                }
                return x.completed;
            }).length;
    };

    const getRequestProgressPoints = (requestId: string) => {
        return sum(
            track.battles
                .flatMap(x => x.requirementsProgress)
                .filter(x => x.id === requestId)
                .map(request => LreRequirementStatusService.getRequirementPoints(request))
        );
    };

    const completionPercentage = Math.round((currentPoints / track.totalPoints) * 100);

    const handleToggle = () => {
        if (
            track.battles.some(battle =>
                battle.requirementsProgress.some(
                    request =>
                        request.status === RequirementStatus.MaybeClear || request.status === RequirementStatus.StopHere
                )
            )
        ) {
            // Only open the confirmation dialog if the user has custom statuses set. Otherwise
            // there's no risk in toggling because they can just sync to restore it.
            handleOpenConfirmDialog();
        } else {
            setAll();
        }
    };

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
            .map(battle => battle.requirementsProgress.filter(request => request.completed).length)
            .reduce((a, b) => a + b, 0);
        const status =
            completedBattles === track.requirements.length * track.battles.length
                ? RequirementStatus.NotCleared
                : RequirementStatus.Cleared;

        let leModel = model;
        for (const battle of track.battles) {
            for (const request of battle.requirementsProgress) {
                leModel = createNewModel(leModel, track.trackId, battle.battleIndex, request.id, status);
            }
        }
        updateDto(leModel);
    };

    return (
        <div className="mx-auto box-border flex w-full flex-col md:w-fit md:max-w-full">
            <h3>
                {completionPercentage}% {track.trackName}
            </h3>
            <div className="start gap5 box-border flex flex-col">
                {track.requirements.map(request => (
                    <div key={request.id} className="flex-box gap5">
                        <div
                            className="h-[15px] w-[15px] rounded-[50px]"
                            style={{
                                backgroundColor: getCompletionRateColor(
                                    getRequestProgress(request.id),
                                    track.battles.length
                                ),
                            }}
                        />
                        <span className="min-w-[50px] font-bold">
                            {getRequestProgress(request.id)}/{track.battles.length}
                        </span>

                        <span className="min-w-20 font-bold">
                            {getRequestProgressPoints(request.id)}/{request.totalPoints}
                        </span>
                        <LreReqImage iconId={request.iconId} />
                        <span className="min-w-[25px] p-1 md:p-1.5">{request.pointsPerBattle || 'x'}</span>
                        <span>{request.name}</span>
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
                    <div className="flex-box gap5 items-center justify-center pb-2.5">
                        <Button size="medium" variant="text" onClick={handleToggle}>
                            <Grid2x2Check className="size-5 md:size-6" />
                        </Button>
                        <SyncButton showText={false} variant={'text'} />
                    </div>
                    <div className="w-full flex-col">
                        <div className="mb-1 flex w-full flex-row">
                            <div className="mr-0 flex min-w-8 shrink-0 items-center justify-center md:mr-1.5 md:min-w-10">
                                <AccessibleTooltip title="Click on a battle number to mark all objectives complete">
                                    <Info className={isMobile ? 'size-5' : 'size-6'} />
                                </AccessibleTooltip>
                            </div>
                            <div className="flex flex-1 flex-row justify-between">
                                {(() => {
                                    const firstRestrictionIndex = LreRequirementStatusService.getFirstRestrictionIndex(
                                        track.requirements
                                    );
                                    return track.requirements.map((request, index) => (
                                        <div
                                            key={request.id}
                                            className={`flex items-center justify-center ${index === firstRestrictionIndex ? 'ml-4' : ''}`}>
                                            <LreReqImage
                                                iconId={request.iconId}
                                                tooltip={getRestrictionTooltip(request)}
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
                                setState={(request, status) =>
                                    updateDto(
                                        createNewModel(model, track.trackId, battle.battleIndex, request.id, status)
                                    )
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
