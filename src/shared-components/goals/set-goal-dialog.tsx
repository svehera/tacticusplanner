import React, { useContext, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import {
    Checkbox,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import Button from '@mui/material/Button';

import Box from '@mui/material/Box';
import { ICharacter2, IMaterialRecipeIngredientFull, IPersonalGoal } from '../../models/interfaces';
import { v4 } from 'uuid';
import { PersonalGoalType, Rank, Rarity } from '../../models/enums';
import InputLabel from '@mui/material/InputLabel';
import { getEnumValues, rankToString } from '../../shared-logic/functions';
import { RankImage } from '../rank-image';
import { Tooltip } from '@fluentui/react-components';
import { enqueueSnackbar } from 'notistack';
import { CharacterItem } from '../character-item';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { CharactersAutocomplete } from '../characters-autocomplete';
import { RankSelect } from '../rank-select';
import { RaritySelect } from '../rarity-select';
import { CharacterTitle } from '../character-title';
import { isEqual } from 'lodash';
import { CharacterUpgrades } from '../character-upgrades';
import { rarityToMaxRank } from '../../models/constants';

const getDefaultForm = (priority: number): IPersonalGoal => ({
    id: v4(),
    character: '',
    type: PersonalGoalType.UpgradeRank,
    targetRarity: Rarity.Common,
    targetRank: Rank.Stone1,
    priority,
    upgrades: [],
    dailyRaids: true,
});

export const SetGoalDialog = ({ onClose }: { onClose?: (goal?: IPersonalGoal) => void }) => {
    const goalsLimit = 20;
    const { characters, goals } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openDialog, setOpenDialog] = React.useState(false);
    const [character, setCharacter] = React.useState<ICharacter2 | null>(null);

    const [form, setForm] = useState<IPersonalGoal>(() => getDefaultForm(goals.length + 1));

    const disableNewGoals = useMemo(() => goals.length === goalsLimit, [goals.length]);

    const handleClose = (goal?: IPersonalGoal | undefined): void => {
        if (goal) {
            dispatch.goals({ type: 'Add', goal });
            enqueueSnackbar(`Goal for ${goal.character} is added`, { variant: 'success' });
        }
        setOpenDialog(false);
        setCharacter(null);
        setForm(getDefaultForm(goal ? goal.priority + 1 : goals.length + 1));
        if (onClose) {
            onClose(goal);
        }
    };

    const rarityValues = useMemo(() => {
        const result = getEnumValues(Rarity).filter(x => !character || x >= character.rarity);
        setForm(curr => ({ ...curr, targetRarity: result[0] }));
        return result;
    }, [character]);

    const targetRaritySelector = (
        <FormControl style={{ marginTop: 20 }} fullWidth>
            <InputLabel id="target-rarity-label">Target Rarity</InputLabel>
            <Select<Rarity>
                id="target-rarity"
                labelId="target-rarity-label"
                label="Target Rarity"
                defaultValue={rarityValues[0]}
                value={form.targetRarity}
                onChange={event => setForm(curr => ({ ...curr, targetRarity: +event.target.value }))}>
                {rarityValues.map(rarity => (
                    <MenuItem key={rarity} value={rarity}>
                        {Rarity[rarity]}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    const maxRank = useMemo(() => {
        return rarityToMaxRank[character?.rarity ?? 0];
    }, [character?.rarity]);

    const rankValues = useMemo(() => {
        const result = getEnumValues(Rank).filter(x => x > 0 && (!character || x >= character.rank) && x <= maxRank);
        setForm(curr => ({ ...curr, targetRank: result[0] }));
        return result;
    }, [character]);

    const targetRankSelector = (
        <FormControl style={{ marginTop: 20 }} fullWidth>
            <InputLabel id="target-rank-label">Target Rank</InputLabel>
            <Select<Rank>
                id="target-rank"
                labelId="target-rank-label"
                label="Target Rank"
                defaultValue={rankValues[0]}
                value={form.targetRank}
                onChange={event => setForm(curr => ({ ...curr, targetRank: +event.target.value }))}>
                {rankValues.map(rank => (
                    <MenuItem key={rank} value={rank}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <span>{rankToString(rank)}</span>
                            <RankImage rank={rank} />
                        </div>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    const allowedCharacters = useMemo(() => {
        switch (form.type) {
            case PersonalGoalType.Ascend:
            case PersonalGoalType.UpgradeRank: {
                return characters.filter(x => x.rank > Rank.Locked);
            }
            case PersonalGoalType.Unlock: {
                return characters.filter(x => x.rank === Rank.Locked);
            }
            default: {
                return characters;
            }
        }
    }, [form.type]);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tooltip
                    content="You can have only 20 goals at the same time"
                    relationship={'description'}
                    visible={disableNewGoals}>
                    <span>
                        <Button variant={'contained'} disabled={disableNewGoals} onClick={() => setOpenDialog(true)}>
                            Set Goal
                        </Button>
                    </span>
                </Tooltip>
            </div>

            <Dialog open={openDialog} onClose={() => handleClose()} fullWidth>
                <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <span>Set Goal</span> {character ? <CharacterTitle character={character} /> : undefined}
                </DialogTitle>
                <DialogContent>
                    <Box
                        component="form"
                        id="set-goal-form"
                        style={{ padding: 20 }}
                        onSubmit={event => event.preventDefault()}>
                        <FormControl style={{ marginTop: 20 }} fullWidth>
                            <InputLabel id="goal-type-label">Goal Type</InputLabel>
                            <Select<PersonalGoalType>
                                id="goal-type"
                                labelId="goal-type-label"
                                label="Goal Type"
                                defaultValue={PersonalGoalType.UpgradeRank}
                                onChange={event => {
                                    const newGoalType = +event.target.value;

                                    if (
                                        (newGoalType === PersonalGoalType.Unlock &&
                                            form.type !== PersonalGoalType.Unlock) ||
                                        (newGoalType !== PersonalGoalType.Unlock &&
                                            form.type === PersonalGoalType.Unlock)
                                    ) {
                                        setCharacter(null);
                                    }

                                    setForm(curr => ({ ...curr, type: newGoalType }));
                                }}>
                                <MenuItem value={PersonalGoalType.UpgradeRank}>Upgrade Rank</MenuItem>
                                <MenuItem value={PersonalGoalType.Ascend}>Ascend</MenuItem>
                                <MenuItem value={PersonalGoalType.Unlock}>Unlock</MenuItem>
                            </Select>
                        </FormControl>

                        <CharactersAutocomplete
                            style={{ marginTop: 20 }}
                            character={character}
                            characters={allowedCharacters}
                            onCharacterChange={setCharacter}
                        />

                        <FormControl style={{ marginTop: 20 }} fullWidth>
                            <InputLabel id="priority-label">Priority</InputLabel>
                            <Select<number>
                                id="priority"
                                labelId="priority-label"
                                label="Priority"
                                defaultValue={goals.length + 1}
                                onChange={event => setForm(curr => ({ ...curr, priority: +event.target.value }))}>
                                {Array.from({ length: goals.length + 1 }, (_, index) => index + 1).map(priority => (
                                    <MenuItem key={priority} value={priority}>
                                        {priority}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {character && form.type === PersonalGoalType.UpgradeRank ? targetRankSelector : undefined}
                        {character && form.type === PersonalGoalType.Ascend ? targetRaritySelector : undefined}

                        <TextField
                            style={{ marginTop: 20 }}
                            fullWidth
                            id="outlined-textarea"
                            label="Notes"
                            placeholder="Notes"
                            multiline
                            helperText="Optional. Max length 200 characters."
                            onChange={event => setForm(curr => ({ ...curr, notes: event.target.value.slice(0, 200) }))}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleClose()}>Cancel</Button>
                    <Button
                        disabled={
                            !character ||
                            (form.type === PersonalGoalType.UpgradeRank && character.rank === form.targetRank) ||
                            (form.type === PersonalGoalType.Ascend && character.rarity === form.targetRarity)
                        }
                        onClick={() => handleClose({ ...form, character: character?.name ?? '' })}>
                        Set
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export const EditGoalDialog = ({
    isOpen,
    onClose,
    goal,
    character,
}: {
    isOpen: boolean;
    goal: IPersonalGoal;
    character: ICharacter2;
    onClose?: (goal?: IPersonalGoal) => void;
}) => {
    const { goals } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openDialog, setOpenDialog] = React.useState(isOpen);

    const [form, setForm] = useState<IPersonalGoal>(goal);
    const [inventoryUpdate, setInventoryUpdate] = useState<IMaterialRecipeIngredientFull[]>([]);
    const handleClose = (updatedGoal?: IPersonalGoal | undefined): void => {
        if (updatedGoal) {
            dispatch.goals({ type: 'Update', goal: updatedGoal });
            if (updatedGoal.currentRank && updatedGoal.currentRank !== character.rank) {
                dispatch.characters({
                    type: 'UpdateRank',
                    character: updatedGoal.character,
                    value: updatedGoal.currentRank,
                });
            }
            if (updatedGoal.currentRarity && updatedGoal.currentRarity !== character.rarity) {
                dispatch.characters({
                    type: 'UpdateRarity',
                    character: updatedGoal.character,
                    value: updatedGoal.currentRarity,
                });
            }

            if (!isEqual(updatedGoal.upgrades, character.upgrades)) {
                dispatch.characters({
                    type: 'UpdateUpgrades',
                    character: updatedGoal.character,
                    value: updatedGoal.upgrades,
                });
            }

            if (inventoryUpdate.length) {
                dispatch.inventory({
                    type: 'DecrementUpgradeQuantity',
                    upgrades: inventoryUpdate.map(x => ({ id: x.id, count: x.count })),
                });
            }

            enqueueSnackbar(`Goal for ${updatedGoal.character} is updated`, { variant: 'success' });
        }
        setOpenDialog(false);
        if (onClose) {
            onClose(updatedGoal);
        }
    };

    const targetRarityValues = useMemo(() => {
        return getEnumValues(Rarity).filter(x => x >= form.currentRarity!);
    }, [form.currentRarity]);

    const currentRarityValues = useMemo(() => {
        return getEnumValues(Rarity).filter(x => x <= form.targetRarity!);
    }, [form.targetRarity]);

    const maxRank = useMemo(() => {
        return rarityToMaxRank[character?.rarity ?? 0];
    }, [character?.rarity]);

    const targetRankValues = useMemo(() => {
        return getEnumValues(Rank).filter(x => x > 0 && x >= form.currentRank! && x <= maxRank);
    }, [form.currentRank]);

    const currentRankValues = useMemo(() => {
        return getEnumValues(Rank).filter(x => x > 0 && x <= form.targetRank!);
    }, [form.targetRank]);

    return (
        <Dialog open={openDialog} onClose={() => handleClose()} fullWidth>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <span>Edit Goal</span> <CharacterTitle character={character} />
            </DialogTitle>
            <DialogContent>
                <Box
                    component="form"
                    id="set-goal-form"
                    style={{ padding: 20 }}
                    onSubmit={event => event.preventDefault()}>
                    <FormControl style={{ marginTop: 20 }} fullWidth>
                        <InputLabel id="priority-label">Priority</InputLabel>
                        <Select<number>
                            id="priority"
                            labelId="priority-label"
                            label="Priority"
                            value={form.priority}
                            onChange={event => setForm(curr => ({ ...curr, priority: +event.target.value }))}>
                            {Array.from({ length: goals.length }, (_, index) => index + 1).map(priority => (
                                <MenuItem key={priority} value={priority}>
                                    {priority}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {form.type === PersonalGoalType.UpgradeRank ? (
                        <div>
                            <div style={{ marginTop: 20 }}>
                                <RankSelect
                                    label={'Current Rank'}
                                    rankValues={currentRankValues}
                                    value={form.currentRank ?? Rank.Stone1}
                                    valueChanges={value =>
                                        setForm(curr => ({ ...curr, currentRank: value, upgrades: [] }))
                                    }
                                />
                            </div>
                            <div style={{ marginTop: 20 }}>
                                <RankSelect
                                    label={'Target Rank'}
                                    rankValues={targetRankValues}
                                    value={form.targetRank ?? Rank.Stone1}
                                    valueChanges={value => setForm(curr => ({ ...curr, targetRank: value }))}
                                />
                            </div>
                            <CharacterUpgrades
                                character={character}
                                upgradesChanges={(upgrades, updateInventory) => {
                                    setForm({
                                        ...form,
                                        upgrades,
                                    });
                                    setInventoryUpdate(updateInventory);
                                }}
                            />
                        </div>
                    ) : undefined}
                    {form.type === PersonalGoalType.Ascend ? (
                        <div>
                            <RaritySelect
                                label={'Current Rarity'}
                                rarityValues={currentRarityValues}
                                value={form.currentRarity ?? Rarity.Common}
                                valueChanges={value => setForm(curr => ({ ...curr, currentRarity: value }))}
                            />
                            <RaritySelect
                                label={'Target Rarity'}
                                rarityValues={targetRarityValues}
                                value={form.targetRarity ?? Rarity.Common}
                                valueChanges={value => setForm(curr => ({ ...curr, targetRarity: value }))}
                            />
                        </div>
                    ) : undefined}

                    <TextField
                        style={{ marginTop: 20 }}
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
                <Button disabled={!form.character} onClick={() => handleClose(form)}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};
