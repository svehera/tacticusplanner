import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { sum } from 'lodash';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { getCompletionRateColor } from '@/fsd/5-shared/lib';

import { LreReqImage, LreTrackId } from '@/fsd/4-entities/lre';

import { ProgressState } from '@/fsd/3-features/lre-progress';

import { LreTrackBattleSummary } from './le-track-battle';
import { ILreTrackProgress } from './lre.models';

interface Props {
    track: ILreTrackProgress;
    toggleBattleState: (trackId: LreTrackId, battleIndex: number, reqId: string, state: ProgressState) => void;
}

export const LreTrackOverallProgress: React.FC<Props> = ({ track, toggleBattleState }) => {
    const currentPoints = sum(
        track.battles
            .flatMap(x => x.requirementsProgress)
            .filter(x => x.completed)
            .map(x => x.points)
    );

    const getReqProgress = (reqId: string) => {
        return track.battles.flatMap(x => x.requirementsProgress).filter(x => x.id === reqId && x.completed).length;
    };
    const getReqProgressPoints = (reqId: string) => {
        return sum(
            track.battles
                .flatMap(x => x.requirementsProgress)
                .filter(x => x.id === reqId && x.completed)
                .map(x => x.points)
        );
    };

    const completionPercentage = Math.round((currentPoints / track.totalPoints) * 100);

    return (
        <div className="flex-box start column" style={{ flex: 1, minWidth: 450 }}>
            <h3>
                {completionPercentage}% {track.trackName}
            </h3>
            <div className="flex-box start column gap5">
                {track.requirements.map(req => (
                    <div key={req.id} className="flex-box gap5">
                        <div
                            style={{
                                width: 15,
                                height: 15,
                                backgroundColor: getCompletionRateColor(getReqProgress(req.id), track.battles.length),
                                borderRadius: 50,
                            }}
                        />
                        <span className="bold" style={{ minWidth: 50 }}>
                            {getReqProgress(req.id)}/{track.battles.length}
                        </span>

                        <span className="bold" style={{ minWidth: 80 }}>
                            {getReqProgressPoints(req.id)}/{req.totalPoints}
                        </span>
                        <LreReqImage iconId={req.iconId} />
                        <span style={{ minWidth: 25 }}>{req.pointsPerBattle || 'x'}</span>
                        <span>{req.name}</span>
                    </div>
                ))}
            </div>
            <Accordion defaultExpanded={!isMobile}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <span style={{ paddingInlineEnd: 5 }}>Battles Progress</span>
                    <span className="bold">
                        {currentPoints}/{track.totalPoints}
                    </span>
                </AccordionSummary>
                <AccordionDetails>
                    <div className="flex-box gap18" style={{ marginInlineStart: 35 }}>
                        {track.requirements.map(req => (
                            <LreReqImage key={req.id} iconId={req.iconId} tooltip={req.name} />
                        ))}
                    </div>
                    <div className="flex-box column">
                        {track.battles.map(battle => (
                            <LreTrackBattleSummary
                                key={battle.battleIndex}
                                battle={battle}
                                toggleState={(req, state) =>
                                    toggleBattleState(track.trackId, battle.battleIndex, req.id, state)
                                }
                            />
                        ))}
                    </div>
                </AccordionDetails>
            </Accordion>
        </div>
    );
};
