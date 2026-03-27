import { FormControl, FormControlLabel, Radio, RadioGroup, Switch } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { IViewOption } from '@/fsd/3-features/view-settings';

export interface ILreSectionVisibilitySettings {
    showAlpha: boolean;
    showBeta: boolean;
    showGamma: boolean;
}

interface Props {
    sectionVisibility: ILreSectionVisibilitySettings;
    save: (setting: keyof ILreSectionVisibilitySettings, value: boolean) => void;
}

export const LreSectionsSettings: React.FC<Props> = ({ sectionVisibility, save }) => {
    const [value, setValue] = useState<keyof ILreSectionVisibilitySettings>('showAlpha');

    const lreSectionOptions: IViewOption<ILreSectionVisibilitySettings>[] = [
        {
            label: 'Alpha',
            key: 'showAlpha',
            value: sectionVisibility.showAlpha,
            disabled: sectionVisibility.showAlpha && !sectionVisibility.showBeta && !sectionVisibility.showGamma,
        },
        {
            label: 'Beta',
            key: 'showBeta',
            value: sectionVisibility.showBeta,
            disabled: sectionVisibility.showBeta && !sectionVisibility.showAlpha && !sectionVisibility.showGamma,
        },
        {
            label: 'Gamma',
            key: 'showGamma',
            value: sectionVisibility.showGamma,
            disabled: sectionVisibility.showGamma && !sectionVisibility.showAlpha && !sectionVisibility.showBeta,
        },
    ];

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const sectionValue = (event.target as HTMLInputElement).value as keyof ILreSectionVisibilitySettings;
        setValue(sectionValue);
        save(sectionValue, true);
        const otherOptions = lreSectionOptions.filter(x => x.key !== sectionValue);
        for (const option of otherOptions) {
            save(option.key, false);
        }
    };

    const renderOption = (option: IViewOption<ILreSectionVisibilitySettings>) => {
        return (
            <div key={option.key}>
                <FormControlLabel
                    label={option.label}
                    control={
                        <Switch
                            checked={option.value}
                            disabled={option.disabled}
                            onChange={event => save(option.key, event.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                    }
                />
            </div>
        );
    };

    useEffect(() => {
        if (sectionVisibility.showAlpha) {
            setValue('showAlpha');
        } else if (sectionVisibility.showBeta) {
            setValue('showBeta');
        } else if (sectionVisibility.showGamma) {
            setValue('showGamma');
        }
    }, [sectionVisibility.showAlpha, sectionVisibility.showBeta, sectionVisibility.showGamma]);

    if (!isMobile) return <div className="flex-box gap5 wrap">{lreSectionOptions.map(renderOption)}</div>;
    return (
        <FormControl className="pl-4">
            <RadioGroup
                row
                aria-labelledby="demo-radio-buttons-group-label"
                value={value}
                onChange={handleChange}
                name="radio-buttons-group">
                <FormControlLabel value="showAlpha" control={<Radio />} label="Alpha" />
                <FormControlLabel value="showBeta" control={<Radio />} label="Beta" />
                <FormControlLabel value="showGamma" control={<Radio />} label="Gamma" />
            </RadioGroup>
        </FormControl>
    );
};
