import Typography from '@mui/material/Typography';
import React from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RichTextViewer } from '@/shared-components/inputs/rich-text-viewer';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUnit } from '@/fsd/3-features/characters/characters.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { TeamView } from '@/fsd/3-features/guides/components/team-view';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { getDisplayName } from '@/fsd/3-features/guides/guides.constants';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ITeamSlot } from '@/fsd/3-features/guides/guides.models';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GameMode } from '@/fsd/3-features/teams/teams.enums';

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
