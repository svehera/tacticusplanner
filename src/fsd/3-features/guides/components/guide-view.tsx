import { DialogActions } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUnit } from '@/fsd/3-features/characters/characters.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GuideCard } from '@/fsd/3-features/guides/components/guide-card';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GuidesStatus } from '@/fsd/3-features/guides/guides.enums';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IGuide } from '@/fsd/3-features/guides/guides.models';

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
