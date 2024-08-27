﻿import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { IUnit } from 'src/v2/features/characters/characters.models';
import { isMobile } from 'react-device-detect';
import { ICreateGuide, ITeamSlot } from 'src/v2/features/guides/guides.models';
import { TeamSlotEdit } from 'src/v2/features/guides/components/team-slot-edit';
import { SelectTeamDialog } from 'src/v2/features/guides/components/select-team-dialog';
import { RichTextEditor } from 'src/v2/components/inputs/rich-text-editor';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { SlotType } from 'src/v2/features/guides/guides.enums';

interface Props {
    units: IUnit[];
    guide: ICreateGuide;
    saveGuide: (guide: ICreateGuide) => void;
    onClose: () => void;
}

export const EditGuideDialog: React.FC<Props> = ({ onClose, units, saveGuide, guide }) => {
    const { t } = useTranslation();
    const [guideText, setGuideText] = useState<string>(guide.guide);
    const [intro, setIntro] = useState<string>(guide.intro);
    const [teamName, setTeamName] = useState<string>(guide.name);
    const [teamSlots, setTeamSlots] = useState<ITeamSlot[]>(guide.teamSlots);

    const [isOpenSelectDialog, setIsOpenSelectDialog] = useState<boolean>(false);

    const closeSelectDialog = (slots: ITeamSlot[]) => {
        setTeamSlots(slots);
        setIsOpenSelectDialog(false);
    };

    const saveChanges = () => {
        saveGuide({
            name: teamName,
            primaryMode: guide.primaryMode,
            guide: guideText,
            intro: intro,
            subModes: guide.subModes,
            teamSlots: teamSlots,
        });
        onClose();
    };

    const disableContinue = (function () {
        if (!teamName.length) {
            return true;
        }

        if (teamSlots.some(x => x.slotType !== SlotType.none && !x.unitIds.length)) {
            return true;
        }

        return false;
    })();

    return (
        <Dialog open={true} onClose={onClose} fullWidth fullScreen={isMobile}>
            <DialogTitle>Edit team guide</DialogTitle>
            <DialogContent style={{ paddingTop: 10 }}>
                <TextField
                    fullWidth
                    label="Team name"
                    variant="outlined"
                    helperText="Max length 50 characters."
                    value={teamName}
                    onChange={event => setTeamName(event.target.value.slice(0, 50))}
                />

                <br />
                <br />

                <TextField
                    fullWidth
                    id="outlined-textarea"
                    label="Intro"
                    placeholder="Into"
                    multiline
                    maxRows={5}
                    value={intro}
                    helperText="Displayed on the team preview. Up to 200 characters"
                    onChange={event => setIntro(event.target.value.slice(0, 200))}
                />

                <br />
                <br />

                <Typography variant="subtitle1" style={{ marginLeft: 10 }}>
                    Guide (supports rich text)
                </Typography>
                <RichTextEditor
                    htmlValue={guideText}
                    onChange={setGuideText}
                    placeholder={t('teams.guidePlaceholder')}
                />

                <br />
                <br />

                <div
                    key={+isOpenSelectDialog}
                    className="flex-box gap5 start"
                    onClick={() => setIsOpenSelectDialog(true)}>
                    {teamSlots.map((slot, index) => (
                        <TeamSlotEdit key={slot.slotNumber} units={units} slot={slot} editable={false} />
                    ))}
                </div>

                {isOpenSelectDialog && <SelectTeamDialog units={units} slots={teamSlots} onClose={closeSelectDialog} />}
            </DialogContent>
            <DialogActions className="flex-box between">
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={saveChanges} disabled={disableContinue}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};