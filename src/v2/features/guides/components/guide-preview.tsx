import React from 'react';
import Typography from '@mui/material/Typography';
import { TeamView } from 'src/v2/features/guides/components/team-view';
import { RichTextViewer } from 'src/v2/components/inputs/rich-text-viewer';
import { GameMode } from 'src/v2/features/teams/teams.enums';
import { ITeamSlot } from 'src/v2/features/guides/guides.models';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { getDisplayName } from 'src/v2/features/guides/guides.contstants';

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
