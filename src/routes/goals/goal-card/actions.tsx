import { ArrowDownward, ArrowUpward, Block, CheckCircle, DeleteForever, Edit } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import React from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { IGoalEstimate } from '@/fsd/3-features/goals/goals.models';

interface Props {
    goalEstimate: IGoalEstimate;
    menuItemSelect?: (item: 'edit' | 'delete' | 'moveUp' | 'moveDown') => void;
}

export const GoalCardActions: React.FC<Props> = ({ goalEstimate, menuItemSelect }) => (
    <div className="flex items-center">
        {!!goalEstimate.completed && !goalEstimate.blocked && (
            <AccessibleTooltip title="Goal is completed in current estimation.">
                <span className="flex-box gap-[3px]" tabIndex={0}>
                    <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />
                </span>
            </AccessibleTooltip>
        )}
        {!!goalEstimate.blocked && (
            <AccessibleTooltip title="Goal is blocked because required farm nodes are not accessible. See Plan > Daily Raids > Raids Plan > Blocked Upgrades for details.">
                <span className="flex-box gap-[3px]" tabIndex={0}>
                    <Block fontSize="small" sx={{ color: 'error.main' }} />
                </span>
            </AccessibleTooltip>
        )}
        {menuItemSelect && (
            <>
                <IconButton size="small" aria-label="Increase Goal Priority" onClick={() => menuItemSelect('moveUp')}>
                    <ArrowUpward fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label="Decrease Goal Priority" onClick={() => menuItemSelect('moveDown')}>
                    <ArrowDownward fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label="Edit Goal" onClick={() => menuItemSelect('edit')}>
                    <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label="Delete Goal" onClick={() => menuItemSelect('delete')}>
                    <DeleteForever fontSize="small" />
                </IconButton>
            </>
        )}
    </div>
);
