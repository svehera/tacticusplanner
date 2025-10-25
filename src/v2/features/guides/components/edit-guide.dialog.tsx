import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';

import { RichTextEditor } from 'src/v2/components/inputs/rich-text-editor';

import { IUnit } from 'src/v2/features/characters/characters.models';
import { SelectTeamDialog } from 'src/v2/features/guides/components/select-team-dialog';
import { TeamSlotEdit } from 'src/v2/features/guides/components/team-slot-edit';
import { SlotType } from 'src/v2/features/guides/guides.enums';
import { ICreateGuide, ITeamSlot } from 'src/v2/features/guides/guides.models';

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
    const [youtubeLink, setYoutubeLink] = useState<string | undefined>(guide.youtubeLink);
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
            youtubeLink: youtubeLink,
            teamSlots: teamSlots,
        });
        onClose();
    };

    const disableContinue = (function () {
        if (!teamName.length || !intro.length || !guideText.length) {
            return true;
        }

        return teamSlots.some(x => x.slotType !== SlotType.none && !x.unitIds.length);
    })();

    return (
        <Dialog open={true} onClose={onClose} fullWidth fullScreen={isMobile}>
            <DialogTitle>Edit team guide</DialogTitle>
            <DialogContent style={{ paddingTop: 10 }}>
                <TextField
                    fullWidth
                    required
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
                    required
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

                <TextField
                    fullWidth
                    id="outlined-textarea"
                    label="Youtube Link"
                    placeholder="Youtube Link"
                    maxRows={5}
                    value={youtubeLink}
                    helperText="Link to the Youtube video featuring team from the guide"
                    onChange={event => setYoutubeLink(event.target.value.slice(0, 100))}
                />

                <br />
                <br />

                <Typography variant="subtitle1" style={{ marginLeft: 10 }}>
                    Guide* (supports rich text)
                </Typography>
                <RichTextEditor
                    htmlValue={guideText}
                    onChange={setGuideText}
                    placeholder={t('teams.guidePlaceholder')}
                />

                <br />
                <br />

                <div key={+isOpenSelectDialog} className="flex gap-[5px]" onClick={() => setIsOpenSelectDialog(true)}>
                    {teamSlots.map(slot => (
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
