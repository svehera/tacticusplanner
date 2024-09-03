import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle, FormControlLabel } from '@mui/material';
import Button from '@mui/material/Button';
import { ILreViewSettings, IViewOption } from 'src/models/interfaces';
import Checkbox from '@mui/material/Checkbox';

interface Props {
    lreViewSettings: ILreViewSettings;
    onClose: () => void;
    save: (updatedSettings: ILreViewSettings) => void;
}

export const LreSettings: React.FC<Props> = ({ onClose, lreViewSettings, save }) => {
    const [viewSettings, setViewSettings] = useState<ILreViewSettings>(lreViewSettings);

    const updatePreferences = (setting: keyof ILreViewSettings, value: boolean) => {
        setViewSettings(curr => ({ ...curr, [setting]: value }));
    };

    const saveChanges = () => {
        save(viewSettings);
        onClose();
    };

    const lreOptions: IViewOption<ILreViewSettings>[] = [
        {
            label: 'Use V1 LRE planner',
            key: 'useV1Lre',
            value: viewSettings.useV1Lre,
            disabled: false,
        },
        {
            label: 'Hide selected teams',
            key: 'hideSelectedTeams',
            value: viewSettings.hideSelectedTeams,
            disabled: false,
        },
        {
            label: 'Lightweight view',
            key: 'lightWeight',
            value: viewSettings.lightWeight,
            disabled: false,
        },
        {
            label: 'Only unlocked characters',
            key: 'onlyUnlocked',
            value: viewSettings.onlyUnlocked,
            disabled: false,
        },
        {
            label: 'Hide completed tracks',
            tooltip: 'Hide tracks where you have completed battle 12',
            key: 'hideCompleted',
            value: viewSettings.hideCompleted,
            disabled: false,
        },
        {
            label: 'Hide characters names',
            key: 'hideNames',
            value: viewSettings.hideNames,
            disabled: viewSettings.lightWeight,
        },
    ];

    const renderOption = (option: IViewOption<ILreViewSettings>) => {
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

    return (
        <Dialog open={true} fullWidth onClose={onClose}>
            <DialogTitle>LRE Planner Settings</DialogTitle>
            <DialogContent>
                {lreOptions.map(renderOption)}
                {/*<div className="flex-box between wrap" style={{ alignItems: 'unset' }}>*/}
                {/*    <FormControl>*/}
                {/*        <FormLabel id="radio-buttons-group" style={{ fontWeight: 'bold' }}>*/}
                {/*            View settings:*/}
                {/*        </FormLabel>*/}
                {/*        <RadioGroup*/}
                {/*            style={{ paddingInlineStart: 20 }}*/}
                {/*            aria-labelledby="radio-buttons-group"*/}
                {/*            name="controlled-radio-buttons-group"*/}
                {/*            value={dailyRaidsPreferencesForm.farmByPriorityOrder + ''}*/}
                {/*            onChange={change =>*/}
                {/*                updatePreferences('farmByPriorityOrder', change.target.value === 'true')*/}
                {/*            }>*/}
                {/*            <FormControlLabel*/}
                {/*                value="false"*/}
                {/*                control={<Radio />}*/}
                {/*                label={*/}
                {/*                    <div className="flex-box start gap5">*/}
                {/*                        By total materials{' '}*/}
                {/*                        <AccessibleTooltip*/}
                {/*                            title={*/}
                {/*                                <p>*/}
                {/*                                    Materials required to accomplish all selected goals will be combined*/}
                {/*                                    together.*/}
                {/*                                    <br /> Pros: You will farm materials for all characters at once and*/}
                {/*                                    overall it will take less time to accomplish all selected goals*/}
                {/*                                    <br /> Cons: Goals priority is ignored and it will take more time to*/}
                {/*                                    accomplish your high priority goals*/}
                {/*                                </p>*/}
                {/*                            }>*/}
                {/*                            <InfoIcon color="primary" />*/}
                {/*                        </AccessibleTooltip>*/}
                {/*                    </div>*/}
                {/*                }*/}
                {/*            />*/}
                {/*            <FormControlLabel*/}
                {/*                value="true"*/}
                {/*                control={<Radio />}*/}
                {/*                label={*/}
                {/*                    <div className="flex-box start gap5">*/}
                {/*                        By goals priority{' '}*/}
                {/*                        <AccessibleTooltip*/}
                {/*                            title={*/}
                {/*                                <p>*/}
                {/*                                    Materials grouped by goals priority.*/}
                {/*                                    <br /> Pros: You will farm materials for each character individually*/}
                {/*                                    and will faster accomplish your high priority goals*/}
                {/*                                    <br /> Cons: Overall it will take more time to accomplish all*/}
                {/*                                    selected goals. It is especially noticeable when you need to farm*/}
                {/*                                    Legendary upgrades for characters of different factions*/}
                {/*                                </p>*/}
                {/*                            }>*/}
                {/*                            <InfoIcon color="primary" />*/}
                {/*                        </AccessibleTooltip>*/}
                {/*                    </div>*/}
                {/*                }*/}
                {/*            />*/}
                {/*        </RadioGroup>*/}
                {/*    </FormControl>*/}
                {/*</div>*/}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={saveChanges}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};
