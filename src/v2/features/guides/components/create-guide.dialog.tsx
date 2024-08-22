import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle, Step, StepLabel, Stepper, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { GameMode } from 'src/v2/features/teams/teams.enums';
import { IUnit } from 'src/v2/features/characters/characters.models';
import {
    allModes,
    gameModes,
    guildRaidBosses,
    guildRaidPrimes,
    gwSubModes,
    taSubModes,
} from 'src/v2/features/teams/teams.constants';
import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import { isMobile } from 'react-device-detect';
import { ICreateGuide, ITeamSlot } from 'src/v2/features/guides/guides.models';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { SlotType } from 'src/v2/features/guides/guides.enums';
import { TeamSlotEdit } from 'src/v2/features/guides/components/team-slot-edit';
import { SelectTeamDialog } from 'src/v2/features/guides/components/select-team-dialog';
import { RichTextEditor } from 'src/v2/components/inputs/rich-text-editor';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { TeamView } from 'src/v2/features/guides/components/team-view';
import { RichTextViewer } from 'src/v2/components/inputs/rich-text-viewer';

interface Props {
    onClose: () => void;
    addTeam: (team: ICreateGuide) => void;
    units: IUnit[];
}

export const CreateGuideDialog: React.FC<Props> = ({ onClose, units, addTeam }) => {
    const lastStep = 3;
    const { t } = useTranslation();
    const [gameMode, setGameMode] = useState<GameMode>(GameMode.guildRaids);
    const [selectedSubModes, setSelectedSubModes] = useState<string[]>([]);
    const [guide, setGuide] = useState<string>('');
    const [intro, setIntro] = useState<string>('');
    const [teamName, setTeamName] = useState<string>('Team');
    const [teamSlots, setTeamSlots] = useState<ITeamSlot[]>([
        {
            slotNumber: 1,
            unitType: UnitType.character,
            slotType: SlotType.core,
            unitIds: [],
        },
        {
            slotNumber: 2,
            unitType: UnitType.character,
            slotType: SlotType.core,
            unitIds: [],
        },
        {
            slotNumber: 3,
            unitType: UnitType.character,
            slotType: SlotType.core,
            unitIds: [],
        },
        {
            slotNumber: 4,
            unitType: UnitType.character,
            slotType: SlotType.core,
            unitIds: [],
        },
        {
            slotNumber: 5,
            unitType: UnitType.character,
            slotType: SlotType.core,
            unitIds: [],
        },
        {
            slotNumber: 6,
            unitType: UnitType.mow,
            slotType: SlotType.core,
            unitIds: [],
        },
    ]);

    const [isOpenSelectDialog, setIsOpenSelectDialog] = useState<boolean>(false);

    const closeSelectDialog = (slots: ITeamSlot[]) => {
        setTeamSlots(slots);
        setIsOpenSelectDialog(false);
    };

    const updateSelectedMod = (values: string[]) => {
        if (values[0] !== gameMode) {
            setGameMode(values[0] as GameMode);
            setSelectedSubModes([]);
        }
    };

    const updateSelectedGuildBosses = (values: string[]) => {
        setSelectedSubModes(values);
        const relatedOption = guildRaidBosses.find(x => x.value === values[0]);
        if (relatedOption) {
            relatedOption.selected = false;
        }
    };

    const updateSelectedGuildPrimes = (values: string[]) => {
        setSelectedSubModes(values);
        const relatedOption = guildRaidPrimes.find(x => x.value === values[0]);
        if (relatedOption) {
            relatedOption.selected = false;
        }
    };

    const [activeStep, setActiveStep] = React.useState(0);

    const handleNext = () => {
        if (activeStep === lastStep) {
            addTeam({
                name: teamName,
                primaryMode: gameMode,
                guide: guide,
                intro: intro,
                subModes: selectedSubModes,
                teamSlots: teamSlots,
            });
            // onClose();
        }
        setActiveStep(prevActiveStep => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

    const disableContinue = (function () {
        if (activeStep === 1) {
            return !selectedSubModes.length;
        }

        if (activeStep === 2) {
            if (!teamName.length) {
                return true;
            }

            if (teamSlots.some(x => x.slotType !== SlotType.none && !x.unitIds.length)) {
                return true;
            }
        }

        return false;
    })();

    const gameModeDisplay = gameModes.find(x => x.value === gameMode)?.label ?? 'NA';
    const subModeDisplay = allModes.find(x => x.value === selectedSubModes[0])?.label ?? 'NA';

    return (
        <Dialog open={true} onClose={onClose} fullWidth fullScreen={isMobile}>
            <DialogTitle>Create team guide</DialogTitle>
            <DialogContent style={{ paddingTop: 10 }}>
                <Stepper activeStep={activeStep} orientation="horizontal" style={{ paddingBottom: 25 }}>
                    <Step>
                        <StepLabel>Game mode</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Sub mode</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Team</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Preview</StepLabel>
                    </Step>
                </Stepper>
                {activeStep === 0 && (
                    <>
                        <MultipleSelect
                            label=""
                            selected={[gameMode]}
                            options={gameModes}
                            multiple={false}
                            optionsChange={updateSelectedMod}
                        />
                    </>
                )}
                {activeStep === 1 && (
                    <>
                        {gameMode === GameMode.guildRaids && (
                            <>
                                <div className="flex-box gap5">
                                    <MultipleSelect
                                        multiple={false}
                                        label="Guild Raid Boss"
                                        selected={selectedSubModes}
                                        options={guildRaidBosses}
                                        optionsChange={updateSelectedGuildBosses}
                                        minWidth={150}
                                    />
                                    <span>OR</span>
                                    <MultipleSelect
                                        multiple={false}
                                        selected={selectedSubModes}
                                        label="Guild Raid Prime"
                                        options={guildRaidPrimes}
                                        optionsChange={updateSelectedGuildPrimes}
                                        minWidth={150}
                                    />
                                </div>
                            </>
                        )}

                        {gameMode === GameMode.tournamentArena && (
                            <MultipleSelect
                                multiple={false}
                                label="TA mode"
                                options={taSubModes}
                                optionsChange={setSelectedSubModes}
                            />
                        )}

                        {gameMode === GameMode.guildWar && (
                            <MultipleSelect
                                multiple={false}
                                label="GW mode"
                                options={gwSubModes}
                                optionsChange={setSelectedSubModes}
                            />
                        )}
                    </>
                )}
                {activeStep === 2 && (
                    <>
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
                            helperText="Displayed on the guid preview. Up to 200 characters"
                            onChange={event => setIntro(event.target.value.slice(0, 200))}
                        />

                        <br />
                        <br />

                        <Typography variant="subtitle1" style={{ marginLeft: 10 }}>
                            Guide (supports rich text)
                        </Typography>
                        <RichTextEditor
                            htmlValue={guide}
                            onChange={setGuide}
                            placeholder={t('teams.guidePlaceholder')}
                        />

                        <br />
                        <br />

                        <div
                            key={+isOpenSelectDialog}
                            className="flex-box gap5 start"
                            onClick={() => setIsOpenSelectDialog(true)}>
                            {teamSlots.map(slot => (
                                <TeamSlotEdit key={slot.slotNumber} units={units} slot={slot} editable={false} />
                            ))}
                        </div>

                        {isOpenSelectDialog && (
                            <SelectTeamDialog units={units} slots={teamSlots} onClose={closeSelectDialog} />
                        )}
                    </>
                )}
                {activeStep === lastStep && (
                    <>
                        <Typography variant="h5" color="text.primary">
                            {teamName}
                        </Typography>

                        <Typography variant="body2" color="text.primary">
                            {gameModeDisplay} - {subModeDisplay}
                        </Typography>

                        <TeamView slots={teamSlots} units={units} expanded />

                        <Typography variant="body2" color="text.secondary">
                            {intro}
                        </Typography>

                        <br />
                        <RichTextViewer htmlValue={guide} />
                    </>
                )}

                {activeStep === lastStep + 1 && (
                    <>
                        <Typography variant="h5" color="text.primary">
                            Thank you for submitting the guide!
                        </Typography>

                        <Typography variant="body2" color="text.primary">
                            It won&apos;t be publicly available until moderator review the guide.
                        </Typography>

                        <Typography variant="body2" color="text.primary">
                            Please be patient, it could take <span className="bold">up to 24 hours</span> before it will
                            be reviewed
                        </Typography>
                    </>
                )}
            </DialogContent>
            <DialogActions className="flex-box between">
                {activeStep !== lastStep + 1 ? (
                    <>
                        <Button onClick={onClose}>Cancel</Button>
                        <div>
                            <Button disabled={activeStep === 0} onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={disableContinue}
                                sx={{ mt: 1, mr: 1 }}>
                                {activeStep === lastStep ? 'Add' : 'Continue'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <Button onClick={onClose}>Close</Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};
