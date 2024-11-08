import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel } from '@mui/material';
import Button from '@mui/material/Button';
import {
    IAutoTeamsPreferences,
    ICharacter2,
    ILreTileSettings,
    ILreViewSettings,
    IViewOption,
} from 'src/models/interfaces';
import Checkbox from '@mui/material/Checkbox';
import { LreTile } from 'src/v2/features/lre/lre-tile';
import { CharacterBias, Rank, Rarity } from 'src/models/enums';
import { isMobile } from 'react-device-detect';
import { MultipleSelectCheckmarks } from 'src/routes/characters/multiple-select';

interface Props {
    lreViewSettings: ILreViewSettings & ILreTileSettings;
    autoTeamsSettings: IAutoTeamsPreferences;
    characters: ICharacter2[];
    onClose: () => void;
    save: (
        updatedSettings: ILreViewSettings & ILreTileSettings,
        autoTeamsSettings: IAutoTeamsPreferences,
        recommendFirst: string[],
        recommendLast: string[]
    ) => void;
}

export const LreSettings: React.FC<Props> = ({ onClose, characters, lreViewSettings, autoTeamsSettings, save }) => {
    const [viewSettings, setViewSettings] = useState<ILreViewSettings & ILreTileSettings>(lreViewSettings);
    const [teamsSettings, setTeamsSettings] = useState<IAutoTeamsPreferences>(autoTeamsSettings);
    const [recommendFirst, setRecommendFirst] = useState<string[]>(
        characters.filter(x => x.bias === CharacterBias.recommendFirst).map(x => x.name)
    );
    const [recommendLast, setRecommendLast] = useState<string[]>(
        characters.filter(x => x.bias === CharacterBias.recommendLast).map(x => x.name)
    );

    const updatePreferences = (
        setting: keyof (ILreViewSettings & ILreTileSettings & IAutoTeamsPreferences),
        value: boolean
    ) => {
        if (Object.hasOwn(viewSettings, setting)) {
            setViewSettings(curr => ({ ...curr, [setting]: value }));
        } else {
            setTeamsSettings(curr => ({ ...curr, [setting]: value }));
        }
    };

    const saveChanges = () => {
        save(viewSettings, teamsSettings, recommendFirst, recommendLast);
        onClose();
    };

    const lreOptions: IViewOption<ILreViewSettings>[] = [
        {
            label: 'Only unlocked characters',
            key: 'onlyUnlocked',
            value: viewSettings.onlyUnlocked,
            disabled: false,
        },
        {
            label: 'Exclude completed tracks',
            tooltip: 'Exclude tracks where you have completed all battles',
            key: 'hideCompleted',
            value: viewSettings.hideCompleted,
            disabled: false,
        },
    ];

    const lreAutoTeamsOptions: IViewOption<IAutoTeamsPreferences>[] = [
        {
            label: 'Prefer characters required for campaigns',
            key: 'preferCampaign',
            value: teamsSettings.preferCampaign,
            disabled: false,
        },
        {
            label: 'Ignore Rank',
            key: 'ignoreRank',
            value: teamsSettings.ignoreRank,
            disabled: false,
        },
        {
            label: 'Ignore Rarity',
            key: 'ignoreRarity',
            value: teamsSettings.ignoreRarity,
            disabled: false,
        },
        {
            label: 'Ignore Bias',
            key: 'ignoreRecommendedFirst',
            value: teamsSettings.ignoreRecommendedFirst,
            disabled: false,
        },
    ];

    const lreTileViewOptions: IViewOption<ILreTileSettings>[] = [
        {
            label: 'Icon',
            key: 'lreTileShowUnitIcon',
            value: viewSettings.lreTileShowUnitIcon,
            disabled: !viewSettings.lreTileShowUnitName,
        },
        {
            label: 'Name',
            key: 'lreTileShowUnitName',
            value: viewSettings.lreTileShowUnitName,
            disabled: !viewSettings.lreTileShowUnitIcon,
        },
        {
            label: 'Rarity',
            key: 'lreTileShowUnitRarity',
            value: viewSettings.lreTileShowUnitRarity,
            disabled: false,
        },
        {
            label: 'Rank',
            key: 'lreTileShowUnitRank',
            value: viewSettings.lreTileShowUnitRank,
            disabled: false,
        },
        {
            label: 'Rank Background',
            key: 'lreTileShowUnitRankBackground',
            value: viewSettings.lreTileShowUnitRankBackground,
            disabled: false,
        },
        {
            label: 'Active Ability',
            key: 'lreTileShowUnitActiveAbility',
            value: viewSettings.lreTileShowUnitActiveAbility,
            disabled: false,
        },
        {
            label: 'Passive Ability',
            key: 'lreTileShowUnitPassiveAbility',
            value: viewSettings.lreTileShowUnitPassiveAbility,
            disabled: false,
        },
        {
            label: 'Bias',
            key: 'lreTileShowUnitBias',
            value: viewSettings.lreTileShowUnitBias,
            disabled: false,
        },
    ];

    const renderOption = (option: IViewOption<ILreViewSettings & ILreTileSettings & IAutoTeamsPreferences>) => {
        return (
            <div key={option.key}>
                <FormControlLabel
                    label={option.label}
                    control={
                        <Checkbox
                            checked={option.value}
                            disabled={option.disabled}
                            onChange={event => updatePreferences(option.key, event.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    }
                />
            </div>
        );
    };

    const lreTileCharacter = {
        name: 'Isabella',
        shortName: 'Isabella',
        icon: 'Isabella-removebg-preview.webp',
        bias: CharacterBias.recommendFirst,
        rank: Rank.Gold1,
        rarity: Rarity.Legendary,
        activeAbilityLevel: 35,
        passiveAbilityLevel: 35,
    } as ICharacter2;

    return (
        <Dialog open={true} fullWidth onClose={onClose} maxWidth="md" fullScreen={isMobile}>
            <DialogTitle>LRE Planner Settings</DialogTitle>
            <DialogContent>
                <div className="flex-box gap5 wrap">{lreOptions.map(renderOption)}</div>
                <Divider orientation="horizontal" />

                <h3>Unit tile view</h3>
                <div className="flex-box gap5 wrap">{lreTileViewOptions.map(renderOption)}</div>
                <LreTile character={lreTileCharacter} settings={viewSettings} />
                <Divider orientation="horizontal" />

                <h3>Units bias</h3>
                <div className="flex-box gap10 start mobile-wrap">
                    <MultipleSelectCheckmarks
                        values={characters.map(x => x.name)}
                        selectedValues={recommendFirst}
                        placeholder="Recommend First"
                        selectionChanges={setRecommendFirst}
                    />
                    <MultipleSelectCheckmarks
                        values={characters.map(x => x.name)}
                        selectedValues={recommendLast}
                        placeholder="Recommend Last"
                        selectionChanges={setRecommendLast}
                    />
                </div>
                <Divider orientation="horizontal" />
                <h3>Auto teams settings</h3>
                <div className="flex-box gap5 wrap">{lreAutoTeamsOptions.map(renderOption)}</div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={saveChanges}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
