import React, { useContext, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Button from '@mui/material/Button';

import Box from '@mui/material/Box';
import { ICampaignsProgress, ICharacter2, IMaterialRecipeIngredientFull } from 'src/models/interfaces';
import { CampaignsLocationsUsage, PersonalGoalType, Rank } from 'src/models/enums';
import { getEnumValues } from 'src/shared-logic/functions';
import { enqueueSnackbar } from 'notistack';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { RankSelect } from '../rank-select';
import { CharacterUpgrades } from '../character-upgrades';
import { rarityToMaxRank } from 'src/models/constants';
import { PrioritySelect } from 'src/shared-components/goals/priority-select';
import { RankGoalSelect } from 'src/shared-components/goals/rank-goal-select';
import { StaticDataService } from 'src/services';
import { EditAscendGoal } from 'src/shared-components/goals/edit-ascend-goal';
import { NumbersInput } from 'src/shared-components/goals/numbers-input';
import { CampaignLocation } from 'src/shared-components/goals/campaign-location';
import { CampaignsUsageSelect } from 'src/shared-components/goals/campaings-usage-select';
import { CharacterRaidGoalSelect, ICharacterAscendGoal } from 'src/v2/features/goals/goals.models';
import { CharacterImage } from 'src/shared-components/character-image';

interface Props {
    isOpen: boolean;
    goal: CharacterRaidGoalSelect;
    character: ICharacter2;
    onClose?: (goal?: CharacterRaidGoalSelect) => void;
}

export const EditGoalDialog: React.FC<Props> = ({ isOpen, onClose, goal, character }) => {
    const { goals, campaignsProgress } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openDialog, setOpenDialog] = React.useState(isOpen);

    const [form, setForm] = useState<CharacterRaidGoalSelect>(goal);
    const [inventoryUpdate, setInventoryUpdate] = useState<IMaterialRecipeIngredientFull[]>([]);
    const handleClose = (updatedGoal?: CharacterRaidGoalSelect | undefined): void => {
        if (updatedGoal) {
            dispatch.goals({ type: 'Update', goal: updatedGoal });

            switch (updatedGoal.type) {
                case PersonalGoalType.Ascend: {
                    dispatch.characters({
                        type: 'UpdateRarity',
                        character: updatedGoal.characterName,
                        value: updatedGoal.rarityStart,
                    });

                    dispatch.characters({
                        type: 'UpdateShards',
                        character: updatedGoal.characterName,
                        value: updatedGoal.shards,
                    });

                    dispatch.characters({
                        type: 'UpdateStars',
                        character: updatedGoal.characterName,
                        value: updatedGoal.starsStart,
                    });
                    break;
                }
                case PersonalGoalType.Unlock: {
                    dispatch.characters({
                        type: 'UpdateShards',
                        character: updatedGoal.characterName,
                        value: updatedGoal.shards,
                    });
                    break;
                }
                case PersonalGoalType.UpgradeRank: {
                    dispatch.characters({
                        type: 'UpdateRank',
                        character: updatedGoal.characterName,
                        value: updatedGoal.rankStart,
                    });
                    dispatch.characters({
                        type: 'UpdateUpgrades',
                        character: updatedGoal.characterName,
                        value: updatedGoal.appliedUpgrades,
                    });
                    break;
                }
            }

            if (inventoryUpdate.length) {
                dispatch.inventory({
                    type: 'DecrementUpgradeQuantity',
                    upgrades: inventoryUpdate.map(x => ({ id: x.id, count: x.count })),
                });
            }

            enqueueSnackbar(`Goal for ${updatedGoal.characterName} is updated`, { variant: 'success' });
        }
        setOpenDialog(false);
        if (onClose) {
            onClose(updatedGoal);
        }
    };

    const handleAscendGoalChanges = (key: keyof ICharacterAscendGoal, value: number) => {
        setForm(curr => ({ ...curr, [key]: value }));
    };

    let currentRankValues: number[] = [];
    let targetRankValues: number[] = [];

    if (form.type === PersonalGoalType.UpgradeRank) {
        const maxRank = Math.max(rarityToMaxRank[form.rarity], form.rankEnd);
        currentRankValues = getEnumValues(Rank).filter(x => x > 0 && x <= form.rankEnd!);
        targetRankValues = getEnumValues(Rank).filter(x => x > 0 && x >= form.rankStart && x <= maxRank);
    }

    const possibleLocations =
        [PersonalGoalType.Ascend, PersonalGoalType.Unlock].includes(form.type) && !!character
            ? StaticDataService.getItemLocations(character.name)
            : [];

    const unlockedLocations = possibleLocations
        .filter(location => {
            const campaignProgress = campaignsProgress[location.campaign as keyof ICampaignsProgress];
            return location.nodeNumber <= campaignProgress;
        })
        .map(x => x.id);

    return (
        <Dialog open={openDialog} onClose={() => handleClose()} fullWidth>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <span>Edit Goal</span> <CharacterImage icon={goal.characterIcon} />
            </DialogTitle>
            <DialogContent>
                <Box id="edit-goal-form" className="flex-box column gap20 full-width start">
                    <PrioritySelect
                        defaultValue={form.priority}
                        maxValue={goals.length}
                        valueChange={value => setForm(curr => ({ ...curr, priority: value }))}
                    />

                    {form.type === PersonalGoalType.UpgradeRank && (
                        <>
                            <div className="flex-box gap10 between full-width">
                                <RankSelect
                                    label={'Current Rank'}
                                    rankValues={currentRankValues}
                                    value={form.rankStart}
                                    valueChanges={value =>
                                        setForm(curr => ({ ...curr, currentRank: value, upgrades: [] }))
                                    }
                                />
                                <RankGoalSelect
                                    allowedValues={targetRankValues}
                                    rank={form.rankEnd}
                                    point5={form.rankPoint5}
                                    onChange={(targetRank, rankPoint5) =>
                                        setForm(curr => ({ ...curr, targetRank, rankPoint5 }))
                                    }
                                />
                            </div>

                            <CharacterUpgrades
                                character={character}
                                upgradesChanges={(upgrades, updateInventory) => {
                                    setForm({
                                        ...form,
                                        appliedUpgrades: upgrades,
                                    });
                                    setInventoryUpdate(updateInventory);
                                }}
                            />
                        </>
                    )}

                    {form.type === PersonalGoalType.Unlock && (
                        <>
                            <NumbersInput
                                title="Owned shards"
                                value={form.shards}
                                valueChange={value => setForm(curr => ({ ...curr, currentShards: value }))}
                            />
                            <div className="flex-box gap5 wrap">
                                {possibleLocations.map(location => (
                                    <CampaignLocation
                                        key={location.id}
                                        location={location}
                                        unlocked={unlockedLocations.includes(location.id)}
                                    />
                                ))}
                            </div>
                            <CampaignsUsageSelect
                                allowIgnore={false}
                                disabled={!unlockedLocations.length}
                                value={form.campaignsUsage ?? CampaignsLocationsUsage.LeastEnergy}
                                valueChange={value => setForm(curr => ({ ...curr, campaignsUsage: value }))}
                            />
                        </>
                    )}

                    {form.type === PersonalGoalType.Ascend && (
                        <>
                            <NumbersInput
                                title="Owned shards"
                                value={form.shards}
                                valueChange={value => setForm(curr => ({ ...curr, currentShards: value }))}
                            />
                            <EditAscendGoal
                                goal={form}
                                possibleLocations={possibleLocations}
                                unlockedLocations={unlockedLocations}
                                onChange={handleAscendGoalChanges}
                            />
                        </>
                    )}

                    <TextField
                        fullWidth
                        id="outlined-textarea"
                        label="Notes"
                        placeholder="Notes"
                        multiline
                        helperText="Optional. Max length 200 characters."
                        value={form.notes}
                        onChange={event => setForm(curr => ({ ...curr, notes: event.target.value.slice(0, 200) }))}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => handleClose()}>Cancel</Button>
                <Button onClick={() => handleClose(form)}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
