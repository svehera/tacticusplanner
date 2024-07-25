import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle, Step, StepLabel, Stepper, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { IPersonalTeam, PersonalTeam } from 'src/v2/features/teams/teams.models';
import { GameMode } from 'src/v2/features/teams/teams.enums';
import { MultipleSelect } from 'src/v2/components/inputs/multiple-select';
import { gameModes, guildRaidSubModes, gwSubModes, taSubModes } from 'src/v2/features/teams/teams.constants';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { getEnumValues } from 'src/shared-logic/functions';
import { Rarity } from 'src/models/enums';
import { RaritySelect } from 'src/shared-components/rarity-select';
import { ICharacter2 } from 'src/models/interfaces';
import { IMow } from 'src/v2/features/characters/characters.models';
import { TeamView } from 'src/v2/features/teams/components/team-view';
import { SelectTeamDialog } from 'src/v2/features/teams/components/select-team-dialog';
import { isMobile } from 'react-device-detect';

interface Props {
    onClose: () => void;
    addTeam: (team: IPersonalTeam) => void;
    characters: ICharacter2[];
    mows: IMow[];
}

export const AddTeamDialog: React.FC<Props> = ({ onClose, characters, mows, addTeam }) => {
    const [gameMode, setGameMode] = useState<GameMode>(GameMode.guildRaids);
    const [selectedSubModes, setSelectedSubModes] = useState<string[]>([]);
    const [notes, setNotes] = useState<string>('');
    const [teamName, setTeamName] = useState<string>('Team');
    const [rarityCap, setRarityCap] = useState(Rarity.Legendary);
    const [team, setTeam] = useState<ICharacter2[]>([]);
    const [mow, setMow] = useState<IMow | null>(null);

    const [isOpenSelectDialog, setIsOpenSelectDialog] = useState<boolean>(false);

    const openSelectDialog = () => setIsOpenSelectDialog(true);
    const closeSelectDialog = (selectedTeam: ICharacter2[], mow: IMow | null) => {
        setTeam(selectedTeam);
        setMow(mow);
        setIsOpenSelectDialog(false);
    };

    const updateSelectedMod = (values: string[]) => {
        if (values[0] !== gameMode) {
            setGameMode(values[0] as GameMode);
            setSelectedSubModes([]);
        }
    };

    const [activeStep, setActiveStep] = React.useState(0);

    const handleNext = () => {
        if (activeStep === 2) {
            addTeam(
                new PersonalTeam(
                    gameMode,
                    selectedSubModes,
                    teamName,
                    notes,
                    rarityCap,
                    team.map(x => x.id),
                    mow?.id
                )
            );
            onClose();
        }
        setActiveStep(prevActiveStep => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep(prevActiveStep => prevActiveStep - 1);
    };

    return (
        <Dialog open={true} onClose={onClose} fullWidth fullScreen={isMobile}>
            <DialogTitle>Add team</DialogTitle>
            <DialogContent style={{ paddingTop: 10 }}>
                <Stepper activeStep={activeStep} orientation="horizontal" style={{ paddingBottom: 25 }}>
                    <Step>
                        <StepLabel>Game mode</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel optional={<Typography variant="caption">Optional</Typography>}>Sub mode</StepLabel>
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
                            <MultipleSelect
                                label="Guild Raid Bosses"
                                options={guildRaidSubModes}
                                optionsChange={setSelectedSubModes}
                            />
                        )}

                        {gameMode === GameMode.tournamentArena && (
                            <MultipleSelect label="TA mode" options={taSubModes} optionsChange={setSelectedSubModes} />
                        )}

                        {gameMode === GameMode.guildWar && (
                            <MultipleSelect label="GW mode" options={gwSubModes} optionsChange={setSelectedSubModes} />
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
                            label="Notes"
                            placeholder="Notes"
                            multiline
                            maxRows={5}
                            value={notes}
                            helperText="Optional. Max length 300 characters."
                            onChange={event => setNotes(event.target.value.slice(0, 300))}
                        />

                        <br />
                        <br />

                        {gameMode === GameMode.tournamentArena && (
                            <>
                                <RaritySelect
                                    label={'Rarity Cap'}
                                    rarityValues={getEnumValues(Rarity)}
                                    value={rarityCap}
                                    valueChanges={setRarityCap}
                                />

                                <br />
                                <br />
                            </>
                        )}

                        <TeamView
                            characters={team}
                            mow={mow}
                            withMow
                            onClick={() => openSelectDialog()}
                            onEmptyClick={() => openSelectDialog()}
                        />

                        {isOpenSelectDialog && (
                            <SelectTeamDialog
                                units={[...characters, ...mows]}
                                team={team}
                                activeMow={mow}
                                rarityCap={rarityCap}
                                onClose={closeSelectDialog}
                            />
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
