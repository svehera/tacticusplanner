import Typography from '@mui/material/Typography';
import React from 'react';

import { RichTextViewer } from 'src/v2/components/inputs/rich-text-viewer';

import { getDisplayName } from '@/v2/features/guides/guides.constants';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { TeamView } from 'src/v2/features/guides/components/team-view';
import { ITeamSlot } from 'src/v2/features/guides/guides.models';
import { GameMode } from 'src/v2/features/teams/teams.enums';

interface Props {
    teamName: string;
    intro: string;
    guide: string;
    gameMode: GameMode;
    subModes: string[];
    teamSlots: ITeamSlot[];
    units: IUnit[];
}

export const GuidePreview: React.FC<Props> = ({ teamName, intro, guide, gameMode, subModes, teamSlots, units }) => {
    const subName: string = getDisplayName(gameMode, subModes);

    return (
        <>
            <Typography variant="h5" color="text.primary">
                {teamName}
            </Typography>

            <Typography variant="body2" color="text.primary">
                {subName}
            </Typography>

            <TeamView slots={teamSlots} units={units} expanded />

            <Typography variant="body2" color="text.secondary">
                {intro}
            </Typography>

            <br />
            <RichTextViewer htmlValue={guide} />
        </>
    );
};
