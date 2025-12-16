import { DialogActions, DialogContent, DialogTitle, Step, StepLabel, Stepper, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useTranslation } from 'react-i18next';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RichTextEditor } from '@/shared-components/inputs/rich-text-editor';

import { UnitType } from '@/fsd/5-shared/model';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MultipleSelect } from '@/fsd/5-shared/ui/input/multiple-select';

import { IUnit } from '@/fsd/4-entities/unit';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GuildRaidsModes } from '@/fsd/3-features/guides/components/gr-modes';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GuidePreview } from '@/fsd/3-features/guides/components/guide-preview';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IncursionModes } from '@/fsd/3-features/guides/components/incursion-modes';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { LreModes } from '@/fsd/3-features/guides/components/lre-modes';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { SelectTeamDialog } from '@/fsd/3-features/guides/components/select-team-dialog';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { TeamSlotEdit } from '@/fsd/3-features/guides/components/team-slot-edit';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { SlotType } from '@/fsd/3-features/guides/guides.enums';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ICreateGuide, ITeamSlot } from '@/fsd/3-features/guides/guides.models';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { gameModesForGuides, gwSubModes, taSubModes } from '@/fsd/3-features/teams/teams.constants';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GameMode } from '@/fsd/3-features/teams/teams.enums';

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
    const [youtubeLink, setYoutubeLink] = useState<string>('');
    const [teamName, setTeamName] = useState<string>('');
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
    ]);

    const [isOpenSelectDialog, setIsOpenSelectDialog] = useState<boolean>(false);
    const [unitsFiltered, setUnitsFiltered] = useState<IUnit[]>(units);

    const closeSelectDialog = (slots: ITeamSlot[]) => {
        setTeamSlots(slots);
        setIsOpenSelectDialog(false);
    };

    const updateSelectedMod = (values: string[]) => {
        if (values[0] !== gameMode) {
            setGameMode(values[0] as GameMode);
            setSelectedSubModes([]);
            setUnitsFiltered(units);
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
                youtubeLink: youtubeLink,
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
            return !selectedSubModes.length || unitsFiltered.length < 5;
        }

        if (activeStep === 2) {
            if (!teamName.length || !intro.length || !guide.length) {
                return true;
            }

            if (teamSlots.some(x => x.slotType !== SlotType.none && !x.unitIds.length)) {
                return true;
            }
        }

        return false;
    })();

    useEffect(() => {
        setTeamSlots(prev => {
            const includeMowSlot = [GameMode.guildRaids, GameMode.guildWar, GameMode.tournamentArena].includes(
                gameMode
            );
            const hasMowSlot = prev.some(slot => slot.unitType === UnitType.mow);

            if (includeMowSlot && !hasMowSlot) {
                return [
                    ...prev,
                    {
                        slotNumber: 6,
                        unitType: UnitType.mow,
                        slotType: SlotType.core,
                        unitIds: [],
                    },
                ];
            }

            if (!includeMowSlot && hasMowSlot) {
                return prev.filter(slot => slot.unitType !== UnitType.mow);
            }

            return prev;
        });
    }, [gameMode]);

    return (
        <Dialog open={true} onClose={onClose} fullWidth fullScreen={isMobile}>
            <DialogTitle>Create team guide</DialogTitle>
            <DialogContent className="pt-2.5">
                <Stepper activeStep={activeStep} orientation="horizontal" className="pb-[25px]">
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
                            options={gameModesForGuides}
                            multiple={false}
                            optionsChange={updateSelectedMod}
                        />
                    </>
                )}
                {activeStep === 1 && (
                    <>
                        {gameMode === GameMode.guildRaids && (
                            <GuildRaidsModes
                                updateSelection={setSelectedSubModes}
                                units={units}
                                filterUnits={setUnitsFiltered}
                            />
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

                        {gameMode === GameMode.legendaryRelease && (
                            <LreModes
                                selectedModes={selectedSubModes}
                                updateSelection={setSelectedSubModes}
                                units={units}
                                filterUnits={setUnitsFiltered}
                            />
                        )}

                        {gameMode === GameMode.incursion && (
                            <IncursionModes
                                selectedModes={selectedSubModes}
                                updateSelection={setSelectedSubModes}
                                units={units}
                                filterUnits={setUnitsFiltered}
                            />
                        )}
                    </>
                )}
                {activeStep === 2 && (
                    <>
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
                            helperText="Displayed on the guide preview. Up to 200 characters"
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

                        <Typography variant="subtitle1" className="ml-2.5">
                            Guide* (supports rich text)
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
                            className="flex gap-[5px]"
                            onClick={() => setIsOpenSelectDialog(true)}>
                            {teamSlots.map(slot => (
                                <TeamSlotEdit
                                    key={slot.slotNumber}
                                    units={unitsFiltered}
                                    slot={slot}
                                    editable={false}
                                />
                            ))}
                        </div>

                        {isOpenSelectDialog && (
                            <SelectTeamDialog units={unitsFiltered} slots={teamSlots} onClose={closeSelectDialog} />
                        )}
                    </>
                )}
                {activeStep === lastStep && (
                    <GuidePreview
                        gameMode={gameMode}
                        guide={guide}
                        intro={intro}
                        teamName={teamName}
                        subModes={selectedSubModes}
                        teamSlots={teamSlots}
                        units={unitsFiltered}
                    />
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
                            Please be patient, it could take <span className="font-bold">up to 24 hours</span> before it
                            will be reviewed
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
