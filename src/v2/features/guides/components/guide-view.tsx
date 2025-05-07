import { DialogActions } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { IUnit } from 'src/v2/features/characters/characters.models';
import { GuideCard } from 'src/v2/features/guides/components/guide-card';
import { GuidesStatus } from 'src/v2/features/guides/guides.enums';
import { IGuide } from 'src/v2/features/guides/guides.models';

interface Props {
    onClose: () => void;
    moderate: (result: GuidesStatus) => void;
    team: IGuide;
    units: IUnit[];
    onHonor: (honored: boolean) => void;
    onViewOriginal: () => void;
    onShare: () => void;
    onEdit: () => void;
}

export const GuideView: React.FC<Props> = ({
    team,
    units,
    onClose,
    moderate,
    onShare,
    onHonor,
    onEdit,
    onViewOriginal,
}) => {
    return (
        <Dialog open={true} onClose={onClose} fullWidth fullScreen={isMobile}>
            <GuideCard
                units={units}
                team={team}
                fullView
                onHonor={onHonor}
                onShare={onShare}
                onEdit={onEdit}
                onViewOriginal={onViewOriginal}
            />
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                {team.permissions.canModerate && (
                    <>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => {
                                moderate(GuidesStatus.approved);
                            }}>
                            Approve
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => {
                                moderate(GuidesStatus.rejected);
                            }}>
                            Reject
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};
