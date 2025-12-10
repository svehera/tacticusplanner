import { Check, Close, QuestionMark, Remove } from '@mui/icons-material';
import { Badge, Popover, TextField } from '@mui/material';
import React, { useState } from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { LreReqImage } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrackRequirement, IRequirementProgress, RequirementStatus } from '@/fsd/3-features/lre';

interface Props {
    progress: IRequirementProgress;
    restriction: ILegendaryEventTrackRequirement;
    onChange: (progress: IRequirementProgress) => void;
    displayProgress: string;
    isKillScore?: boolean;
}

const STATUS_COLORS = {
    [RequirementStatus.NotCleared]: '#9e9e9e', // Gray
    [RequirementStatus.Cleared]: '#4caf50', // Green
    [RequirementStatus.MaybeClear]: '#ffc107', // Yellow
    [RequirementStatus.StopHere]: '#f44336', // Red
    [RequirementStatus.PartiallyCleared]: '#2196f3', // Blue
};

const STATUS_ICONS = {
    [RequirementStatus.NotCleared]: null,
    [RequirementStatus.Cleared]: <Check fontSize="small" />,
    [RequirementStatus.MaybeClear]: <QuestionMark fontSize="small" />,
    [RequirementStatus.StopHere]: <Close fontSize="small" />,
    [RequirementStatus.PartiallyCleared]: <Remove fontSize="small" />,
};

export const StatusCheckbox: React.FC<Props> = ({ restriction, progress, onChange, displayProgress, isKillScore }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [killScoreInput, setKillScoreInput] = useState<string>(String(progress.killScore || ''));

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();

        // Cycle through statuses
        let nextStatus = progress.status + 1;

        // Skip PartiallyCleared if not kill score column
        if (nextStatus === RequirementStatus.PartiallyCleared && !isKillScore) {
            nextStatus = RequirementStatus.NotCleared;
        }

        // Wrap around
        if (nextStatus > RequirementStatus.PartiallyCleared) {
            nextStatus = RequirementStatus.NotCleared;
        }

        const newProgress: IRequirementProgress = {
            status: nextStatus as RequirementStatus,
        };

        // If switching to PartiallyCleared and it's kill score, show popover for input
        if (nextStatus === RequirementStatus.PartiallyCleared && isKillScore) {
            setAnchorEl(event.currentTarget);
            return;
        }

        // Clear killScore when switching away from PartiallyCleared or to Cleared
        if (nextStatus !== RequirementStatus.PartiallyCleared) {
            newProgress.killScore = undefined;
        }

        onChange(newProgress);
    };

    const handleRightClick = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (isKillScore && progress.status === RequirementStatus.PartiallyCleared) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handleKillScoreSubmit = () => {
        const score = parseInt(killScoreInput);
        if (!isNaN(score) && score >= 0) {
            onChange({
                status: RequirementStatus.PartiallyCleared,
                killScore: score,
            });
        }
        setAnchorEl(null);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
        setKillScoreInput(String(progress.killScore || ''));
    };

    const badgeColor = STATUS_COLORS[progress.status];
    const badgeIcon = STATUS_ICONS[progress.status];

    return (
        <>
            <AccessibleTooltip
                title={
                    <div>
                        <div>{restriction.name}</div>
                        {isKillScore && (
                            <div style={{ fontSize: '0.8em', marginTop: 4 }}>Right-click to edit kill score</div>
                        )}
                    </div>
                }>
                <div
                    style={{ cursor: 'pointer' }}
                    className="flex-box column"
                    onClick={handleClick}
                    onContextMenu={handleRightClick}>
                    <Badge
                        badgeContent={badgeIcon}
                        sx={{
                            '& .MuiBadge-badge': {
                                backgroundColor: badgeColor,
                                color: 'white',
                            },
                        }}>
                        <span style={{ width: 40 }}>{restriction.points}</span>
                    </Badge>
                    <LreReqImage iconId={restriction.iconId!} />
                    <span>{displayProgress}</span>
                    {progress.status === RequirementStatus.PartiallyCleared && progress.killScore !== undefined && (
                        <span
                            style={{
                                fontSize: 10,
                                color: STATUS_COLORS[RequirementStatus.PartiallyCleared],
                                fontWeight: 'bold',
                            }}>
                            Score: {progress.killScore}
                        </span>
                    )}
                    <span style={{ fontSize: 10, maxHeight: 10 }}>{restriction.name}</span>
                </div>
            </AccessibleTooltip>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 'bold' }}>Enter Kill Score</div>
                    <TextField
                        autoFocus
                        size="small"
                        type="number"
                        label="Kill Score"
                        value={killScoreInput}
                        onChange={e => setKillScoreInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                handleKillScoreSubmit();
                            }
                        }}
                        slotProps={{ htmlInput: { min: 0 } }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={handlePopoverClose} style={{ padding: '4px 12px' }}>
                            Cancel
                        </button>
                        <button
                            onClick={handleKillScoreSubmit}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                            }}>
                            Save
                        </button>
                    </div>
                </div>
            </Popover>
        </>
    );
};
