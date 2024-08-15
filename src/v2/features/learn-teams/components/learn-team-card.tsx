import React from 'react';
import { ILearnTeam } from 'src/v2/features/learn-teams/learn-teams.models';
import { Card, CardActions, CardContent, CardHeader, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { TokenImage } from 'src/v2/components/images/token-image';
import { TeamView } from 'src/v2/features/learn-teams/components/team-view';
import { TeamStatus } from 'src/v2/features/learn-teams/learn-teams.enums';
import { isMobile } from 'react-device-detect';
import { RichTextViewer } from 'src/v2/components/inputs/rich-text-viewer';
import { allModes, gameModes } from 'src/v2/features/teams/teams.constants';

interface Props {
    team: ILearnTeam;
    units: IUnit[];
    fullView?: boolean;
    onView?: () => void;
}

export const LearnTeamCard: React.FC<Props> = ({ team, units, fullView = false, onView = () => {} }) => {
    const renderLikeAndShare = () => {
        if (team.status !== TeamStatus.approved) {
            return <></>;
        }

        return (
            <>
                <IconButton aria-label="add to favorites">
                    <FavoriteIcon />
                </IconButton>
                <IconButton aria-label="share">
                    <ShareIcon />
                </IconButton>
            </>
        );
    };

    const gameMode = gameModes.find(x => x.value === team.primaryMode)?.label ?? 'NA';
    const subMode = allModes.find(x => x.value === team.subModes[0])?.label ?? 'NA';

    return (
        <Card
            sx={{
                maxWidth: !fullView ? 420 : 'unset',
                minWidth: isMobile ? 'unset' : 420,
                overflow: 'auto',
                zoom: isMobile ? '90%' : '100%',
            }}
            variant="outlined">
            <CardHeader
                style={{ paddingBottom: 0 }}
                avatar={<TokenImage gameMode={team.primaryMode} />}
                action={
                    <>
                        {renderLikeAndShare()}

                        <IconButton aria-label="settings" onClick={onView}>
                            <MoreVertIcon />
                        </IconButton>
                    </>
                }
                title={team.name}
                subheader={`By ${team.createdBy}`}
            />
            <CardContent onClick={onView}>
                <Typography variant="body2" color="text.primary">
                    {gameMode} - {subMode}
                </Typography>

                <TeamView slots={team.teamSlots} units={units} expanded={fullView} />

                <Typography variant="body2" color="text.secondary">
                    {team.intro}
                </Typography>
            </CardContent>

            {!fullView && team.status === TeamStatus.approved && (
                <CardActions disableSpacing>{renderLikeAndShare()}</CardActions>
            )}
            {fullView && (
                <CardContent>
                    <RichTextViewer htmlValue={team.guide} />
                </CardContent>
            )}
        </Card>
    );
};
