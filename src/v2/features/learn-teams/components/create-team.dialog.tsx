import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle, Step, StepLabel, Stepper, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { GameMode } from 'src/v2/features/teams/teams.enums';
import { IUnit } from 'src/v2/features/characters/characters.models';
import {
    gameModes,
    guildRaidBosses,
    guildRaidPrimes,
    gwSubModes,
    taSubModes,
} from 'src/v2/features/teams/teams.constants';
import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import { isMobile } from 'react-device-detect';
import { ICreateLearnTeam, ITeamSlot } from 'src/v2/features/learn-teams/learn-teams.models';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { SlotType } from 'src/v2/features/learn-teams/learn-teams.enums';
import { TeamSlotEdit } from 'src/v2/features/learn-teams/components/team-slot-edit';
import InfoIcon from '@mui/icons-material/Info';
import { SelectTeamDialog } from 'src/v2/features/learn-teams/components/select-team-dialog';
import { RichTextEditor } from 'src/v2/components/inputs/rich-text-editor';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

interface Props {
    onClose: () => void;
    addTeam: (team: ICreateLearnTeam) => void;
    units: IUnit[];
}

export const CreateTeamDialog: React.FC<Props> = ({ onClose, units, addTeam }) => {
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
        if (activeStep === 2) {
            addTeam({
                name: teamName,
                primaryMode: gameMode,
                guide: guide,
                intro: intro,
                subModes: selectedSubModes,
                teamSlots: teamSlots,
            });
            onClose();
        }
        setActiveStep(prevActiveStep => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

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
                </Stepper>
                {activeStep === 0 && (
                    <>
                        <MultipleSelect
                            label=""
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
                                <div className="flex-box">
                                    <InfoIcon color="warning" />
                                    <span>Only 1 boss OR prime can be selected.</span>
                                </div>
                                <br />
                                <MultipleSelect
                                    multiple={false}
                                    label="Guild Raid Boss"
                                    options={guildRaidBosses}
                                    optionsChange={updateSelectedGuildBosses}
                                />
                                <br />
                                <br />
                                OR
                                <br />
                                <br />
                                <MultipleSelect
                                    multiple={false}
                                    label="Guild Raid Prime"
                                    options={guildRaidPrimes}
                                    optionsChange={updateSelectedGuildPrimes}
                                />
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
                            helperText="Displayed on the team preview. Up to 200 characters"
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
                            {teamSlots.map((slot, index) => (
                                <TeamSlotEdit key={slot.slotNumber} units={units} slot={slot} editable={false} />
                            ))}
                        </div>

                        {isOpenSelectDialog && (
                            <SelectTeamDialog units={units} slots={teamSlots} onClose={closeSelectDialog} />
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions className="flex-box between">
                <Button onClick={onClose}>Cancel</Button>
                <div>
                    <Button disabled={activeStep === 0} onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
                        Back
                    </Button>
                    <Button variant="contained" onClick={handleNext} sx={{ mt: 1, mr: 1 }}>
                        {activeStep === 2 ? 'Add' : 'Continue'}
                    </Button>
                </div>
            </DialogActions>
        </Dialog>
    );
};
