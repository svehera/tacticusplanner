import { ArrowDownward, ArrowUpward, Block, CheckCircle, DeleteForever, Edit } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import React from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { IGoalEstimate } from '@/fsd/3-features/goals';

interface Props {
    goalEstimate: IGoalEstimate;
    menuItemSelect?: (item: 'edit' | 'delete' | 'moveUp' | 'moveDown') => void;
}

/** Renders the action buttons and status indicators (completion, blocked) for a goal card. */
export const GoalCardActions: React.FC<Props> = ({ goalEstimate, menuItemSelect }) => (
    <div className="flex items-center gap-0.5 text-(--muted-fg)">
        {!!goalEstimate.completed && !goalEstimate.blocked && (
            <AccessibleTooltip title="Goal is completed in current estimation.">
                <span className="flex-box gap-[3px]" tabIndex={0}>
                    <CheckCircle fontSize="small" className="text-success" />
                </span>
            </AccessibleTooltip>
        )}
        {!!goalEstimate.blocked && (
            <AccessibleTooltip title="Goal is blocked because required farm nodes are not accessible. See Plan > Daily Raids > Raids Plan > Blocked Upgrades for details.">
                <span className="flex-box gap-[3px]" tabIndex={0}>
                    <Block fontSize="small" className="text-danger" />
                </span>
            </AccessibleTooltip>
        )}
        {menuItemSelect && (
            <>
                <IconButton
                    size="small"
                    className="text-(--muted-fg)"
                    aria-label="Increase Goal Priority"
                    onClick={() => menuItemSelect('moveUp')}>
                    <ArrowUpward fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    className="text-(--muted-fg)"
                    aria-label="Decrease Goal Priority"
                    onClick={() => menuItemSelect('moveDown')}>
                    <ArrowDownward fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    className="text-(--muted-fg)"
                    aria-label="Edit Goal"
                    onClick={() => menuItemSelect('edit')}>
                    <Edit fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    className="text-(--muted-fg)"
                    aria-label="Delete Goal"
                    onClick={() => menuItemSelect('delete')}>
                    <DeleteForever fontSize="small" />
                </IconButton>
            </>
        )}
    </div>
);
