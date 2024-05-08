import React, { useContext, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import {
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    MenuItem,
    Select,
    SelectChangeEvent,
    TextField,
} from '@mui/material';
import Button from '@mui/material/Button';

import Box from '@mui/material/Box';
import { ICampaignsProgress, ICharacter2, IPersonalGoal } from 'src/models/interfaces';
import { v4 } from 'uuid';
import { CampaignsLocationsUsage, PersonalGoalType, Rank, Rarity, RarityStars, RarityString } from 'src/models/enums';
import InputLabel from '@mui/material/InputLabel';
import { getEnumValues } from 'src/shared-logic/functions';
import { enqueueSnackbar } from 'notistack';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { CharactersAutocomplete } from '../characters-autocomplete';
import { CharacterTitle } from '../character-title';
import { rarityToMaxRank } from 'src/models/constants';
import { Conditional } from 'src/v2/components/conditional';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { IgnoreRankRarity } from './ignore-rank-rarity';
import { PrioritySelect } from 'src/shared-components/goals/priority-select';
import { RankGoalSelect } from 'src/shared-components/goals/rank-goal-select';
import { CampaignsUsageSelect } from 'src/shared-components/goals/campaings-usage-select';
import { StaticDataService } from 'src/services';
import { CampaignLocation } from 'src/shared-components/goals/campaign-location';
import { SetAscendGoal } from 'src/shared-components/goals/set-ascend-goal';
import MultipleSelectCheckmarks from 'src/routes/characters/multiple-select';

const getDefaultForm = (priority: number): IPersonalGoal => ({
    id: v4(),
    character: '',
    type: PersonalGoalType.UpgradeRank,
    targetRarity: Rarity.Common,
    targetRank: Rank.Stone1,
    targetStars: RarityStars.None,
    shardsPerToken: 0,
    campaignsUsage: CampaignsLocationsUsage.LeastEnergy,
    priority,
    dailyRaids: true,
    rankPoint5: false,
    upgradesRarity: [],
});

export const SetGoalDialog = ({ onClose }: { onClose?: (goal?: IPersonalGoal) => void }) => {
    const goalsLimit = 30;
    const { characters, goals, campaignsProgress } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [openDialog, setOpenDialog] = React.useState(false);
    const [ignoreRankRarity, setIgnoreRankRarity] = React.useState(false);
    const [character, setCharacter] = React.useState<ICharacter2 | null>(null);

    const [form, setForm] = useState<IPersonalGoal>(() => getDefaultForm(goals.length + 1));

    const disableNewGoals = useMemo(() => goals.length === goalsLimit, [goals.length]);

    const handleClose = (goal?: IPersonalGoal | undefined): void => {
        if (goal) {
            dispatch.goals({ type: 'Add', goal });
            enqueueSnackbar(`Goal for ${goal.character} is added`, { variant: 'success' });
            if ([PersonalGoalType.Unlock, PersonalGoalType.Ascend].includes(goal.type)) {
                goal.dailyRaids = false;
            }
        }
        setOpenDialog(false);
        setCharacter(null);
        setForm(getDefaultForm(goal ? goal.priority + 1 : goals.length + 1));
        if (onClose) {
            onClose(goal);
        }
    };

    const handleAscendGoalChanges = (key: keyof IPersonalGoal, value: number) => {
        setForm(curr => ({ ...curr, [key]: value }));
    };

    const maxRank = useMemo(() => {
        return ignoreRankRarity ? Rank.Diamond3 : rarityToMaxRank[character?.rarity ?? 0];
    }, [character?.rarity, ignoreRankRarity]);

    const rankValues = useMemo(() => {
        const result = getEnumValues(Rank).filter(x => x > 0 && (!character || x >= character.rank) && x <= maxRank);
        setForm(curr => ({ ...curr, targetRank: result[0] }));
        return result;
    }, [character, maxRank]);

    const allowedCharacters = useMemo(() => {
        switch (form.type) {
            case PersonalGoalType.Ascend:
            case PersonalGoalType.UpgradeRank: {
                return ignoreRankRarity ? characters : characters.filter(x => x.rank > Rank.Locked);
            }
            case PersonalGoalType.Unlock: {
                return characters.filter(x => x.rank === Rank.Locked);
            }
            default: {
                return characters;
            }
        }
    }, [form.type, ignoreRankRarity]);

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

    const handleGoalTypeChange = (event: SelectChangeEvent<number>) => {
        const newGoalType = +event.target.value;

        if (
            (newGoalType === PersonalGoalType.Unlock && form.type !== PersonalGoalType.Unlock) ||
            (newGoalType !== PersonalGoalType.Unlock && form.type === PersonalGoalType.Unlock)
        ) {
            setCharacter(null);
        }

        setForm(curr => ({ ...curr, type: newGoalType }));
    };

    const handleCharacterChange = (value: ICharacter2 | null) => {
        setCharacter(value);

        if (value) {
            setForm(curr => ({
                ...curr,
                targetRank: value.rank,
                targetStars: value.stars,
                targetRarity: value.rarity,
            }));
        }
    };

    const isDisabled = () => {
        if (!character) {
            return true;
        }

        if (form.type === PersonalGoalType.UpgradeRank) {
            return character.rank === form.targetRank && !form.rankPoint5;
        }

        if (form.type === PersonalGoalType.Ascend) {
            return (
                (character.rarity === form.targetRarity && character.stars === form.targetStars) ||
                (!unlockedLocations.length && form.shardsPerToken! <= 0)
            );
        }

        if (form.type === PersonalGoalType.Unlock) {
            return !unlockedLocations.length;
        }

        return false;
    };

    return (
        <>
            <AccessibleTooltip title={disableNewGoals ? 'You can have only 20 goals at the same time' : ''}>
                <span>
                    <Button variant={'contained'} disabled={disableNewGoals} onClick={() => setOpenDialog(true)}>
                        Set Goal
                    </Button>
                </span>
            </AccessibleTooltip>

            <Dialog open={openDialog} onClose={() => handleClose()} fullWidth>
                <DialogTitle className="flex-box gap15">
                    <span>Set Goal</span> {!!character && <CharacterTitle character={character} />}
                </DialogTitle>

                <DialogContent style={{ paddingTop: 10 }}>
                    <Box id="set-goal-form" className="flex-box column gap20 full-width start">
                        <Conditional condition={[PersonalGoalType.UpgradeRank].includes(form.type)}>
                            <IgnoreRankRarity value={ignoreRankRarity} onChange={setIgnoreRankRarity} />
                        </Conditional>

                        <FormControl fullWidth>
                            <InputLabel id="goal-type-label">Goal Type</InputLabel>
                            <Select<PersonalGoalType>
                                id="goal-type"
                                labelId="goal-type-label"
                                label="Goal Type"
                                defaultValue={PersonalGoalType.UpgradeRank}
                                onChange={handleGoalTypeChange}>
                                <MenuItem value={PersonalGoalType.UpgradeRank}>Upgrade Rank</MenuItem>
                                <MenuItem value={PersonalGoalType.Ascend}>Ascend</MenuItem>
                                <MenuItem value={PersonalGoalType.Unlock}>Unlock</MenuItem>
                            </Select>
                        </FormControl>

                        <div className="flex-box gap10 full-width">
                            <div style={{ width: '50%' }}>
                                <CharactersAutocomplete
                                    character={character}
                                    characters={allowedCharacters}
                                    onCharacterChange={handleCharacterChange}
                                />
                            </div>

                            <div style={{ width: '50%' }}>
                                <PrioritySelect
                                    value={form.priority}
                                    maxValue={goals.length + 1}
                                    valueChange={value => setForm(curr => ({ ...curr, priority: value }))}
                                />
                            </div>
                        </div>

                        <Conditional condition={!!character && form.type === PersonalGoalType.UpgradeRank}>
                            <RankGoalSelect
                                allowedValues={rankValues}
                                rank={form.targetRank}
                                point5={!!form.rankPoint5}
                                onChange={(targetRank, rankPoint5) =>
                                    setForm(curr => ({ ...curr, targetRank, rankPoint5 }))
                                }
                            />
                            <MultipleSelectCheckmarks
                                placeholder="Upgrades rarity"
                                selectedValues={form.upgradesRarity!.map(x => Rarity[x])}
                                values={Object.values(RarityString)}
                                selectionChanges={values => {
                                    setForm(curr => ({
                                        ...curr,
                                        upgradesRarity: values.map(x => +Rarity[x as unknown as number]),
                                    }));
                                }}
                            />
                        </Conditional>

                        {form.type === PersonalGoalType.Ascend && !!character && (
                            <SetAscendGoal
                                currentRarity={character.rarity}
                                targetRarity={form.targetRarity!}
                                currentStars={character.stars}
                                targetStars={form.targetStars!}
                                possibleLocations={possibleLocations}
                                unlockedLocations={unlockedLocations}
                                campaignsUsage={form.campaignsUsage!}
                                shardsPerToken={form.shardsPerToken!}
                                onChange={handleAscendGoalChanges}
                            />
                        )}

                        <Conditional condition={!!character && form.type === PersonalGoalType.Unlock}>
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
                        </Conditional>

                        <TextField
                            fullWidth
                            id="outlined-textarea"
                            label="Notes"
                            placeholder="Notes"
                            multiline
                            helperText="Optional. Max length 200 characters."
                            onChange={event =>
                                setForm(curr => ({
                                    ...curr,
                                    notes: event.target.value.slice(0, 200),
                                }))
                            }
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleClose()}>Cancel</Button>
                    <Button
                        disabled={isDisabled()}
                        onClick={() => handleClose({ ...form, character: character?.name ?? '' })}>
                        Set
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
