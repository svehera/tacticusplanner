import React from 'react';
import { IGuide } from 'src/v2/features/guides/guides.models';
import { Card, CardActions, CardContent, CardHeader, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { TokenImage } from 'src/v2/components/images/token-image';
import { TeamView } from 'src/v2/features/guides/components/team-view';
import { GuidesStatus } from 'src/v2/features/guides/guides.enums';
import { isMobile } from 'react-device-detect';
import { RichTextViewer } from 'src/v2/components/inputs/rich-text-viewer';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import Button from '@mui/material/Button';
import { getDisplayName } from 'src/v2/features/guides/guides.contstants';

interface Props {
    team: IGuide;
    units: IUnit[];
    fullView?: boolean;
    onView?: () => void;
    onViewOriginal: () => void;
    onHonor: (honored: boolean) => void;
    onShare: () => void;
    onEdit: () => void;
}

export const GuideCard: React.FC<Props> = ({
    team: guide,
    units,
    fullView = false,
    onView = () => {},
    onHonor,
    onShare,
    onEdit,
    onViewOriginal,
}) => {
    const honorGuide = () => {
        onHonor(true);
        guide.likes++;
    };

    const dishonorGuide = () => {
        onHonor(false);
        guide.likes--;
    };

    const renderActions = () => {
        if (guide.status !== GuidesStatus.approved) {
            return (
                <>
                    {guide.youtubeLink && (
                        <IconButton href={guide.youtubeLink} target="_blank">
                            <AccessibleTooltip title="Youtube">
                                <YouTubeIcon color="error" />
                            </AccessibleTooltip>
                        </IconButton>
                    )}

                    {guide.permissions.canEdit && (
                        <IconButton aria-label="add to favorites" onClick={onEdit}>
                            <AccessibleTooltip title="Edit">
                                <EditIcon />
                            </AccessibleTooltip>
                        </IconButton>
                    )}
                </>
            );
        }

        return (
            <>
                <div className="flex-box">
                    {guide.isHonored ? (
                        <IconButton
                            aria-label="add to favorites"
                            disabled={!guide.permissions.canHonor}
                            onClick={dishonorGuide}>
                            <AccessibleTooltip title="Remove Honor">
                                <FavoriteIcon />
                            </AccessibleTooltip>
                        </IconButton>
                    ) : (
                        <IconButton
                            aria-label="add to favorites"
                            disabled={!guide.permissions.canHonor}
                            onClick={honorGuide}>
                            <AccessibleTooltip title="Do Honor">
                                <FavoriteBorderIcon />
                            </AccessibleTooltip>
                        </IconButton>
                    )}
                    <span className="bold">{guide.likes}</span>
                </div>

                <IconButton aria-label="share" onClick={onShare}>
                    <AccessibleTooltip title="Share">
                        <ShareIcon />
                    </AccessibleTooltip>
                </IconButton>

                {guide.youtubeLink && (
                    <IconButton href={guide.youtubeLink} target="_blank">
                        <AccessibleTooltip title="Youtube">
                            <YouTubeIcon color="error" />
                        </AccessibleTooltip>
                    </IconButton>
                )}

                {guide.permissions.canEdit && (
                    <IconButton aria-label="add to favorites" onClick={onEdit}>
                        <AccessibleTooltip title="Edit">
                            <EditIcon />
                        </AccessibleTooltip>
                    </IconButton>
                )}
            </>
        );
    };

    const displayName = getDisplayName(guide.primaryMode, guide.subModes);

    return (
        <Card
            sx={{
                maxWidth: !fullView ? 425 : 'unset',
                minWidth: isMobile ? 'unset' : 425,
                overflow: 'auto',
                zoom: isMobile ? '90%' : '100%',
            }}
            variant="outlined">
            <CardHeader
                style={{ paddingBottom: 0 }}
                avatar={<TokenImage gameMode={guide.primaryMode} />}
                action={
                    <>
                        {fullView ? (
                            <CardActions disableSpacing>{renderActions()}</CardActions>
                        ) : (
                            <IconButton aria-label="settings" onClick={onView}>
                                <MoreVertIcon />
                            </IconButton>
                        )}
                    </>
                }
                title={guide.name}
                subheader={`By ${guide.createdBy}`}
            />
            <CardContent onClick={onView}>
                {(guide.status === GuidesStatus.rejected || guide.status === GuidesStatus.pending) &&
                    !!guide.originalTeamId && <Button onClick={onViewOriginal}>View original team</Button>}
                {guide.status === GuidesStatus.rejected && (
                    <Typography variant="body2" color="error">
                        {guide.rejectReason} (Rejected by {guide.moderatedBy})
                    </Typography>
                )}
                <Typography variant="body2" color="text.primary">
                    {displayName}
                </Typography>

                <TeamView slots={guide.teamSlots} units={units} expanded={fullView} />

                <Typography variant="body2" color="text.secondary">
                    {guide.intro}
                </Typography>
            </CardContent>

            {!fullView && <CardActions disableSpacing>{renderActions()}</CardActions>}
            {fullView && (
                <CardContent>
                    <RichTextViewer htmlValue={guide.guide} />
                </CardContent>
            )}
        </Card>
    );
};
