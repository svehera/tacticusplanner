import { FormControl, FormControlLabel, Radio, RadioGroup, Switch } from '@mui/material';
import React, { useEffect } from 'react';
import { isMobile } from 'react-device-detect';

import { ILreViewSettings, IViewOption } from 'src/models/interfaces';

interface Props {
    lreViewSettings: ILreViewSettings;
    save: (setting: keyof ILreViewSettings, value: boolean) => void;
}

export const LreSectionsSettings: React.FC<Props> = ({ lreViewSettings, save }) => {
    const [value, setValue] = React.useState<keyof ILreViewSettings>('showAlpha');

    const lreSectionOptions: IViewOption<ILreViewSettings>[] = [
        {
            label: 'Alpha',
            key: 'showAlpha',
            value: lreViewSettings.showAlpha,
            disabled: lreViewSettings.showAlpha && !lreViewSettings.showBeta && !lreViewSettings.showGamma,
        },
        {
            label: 'Beta',
            key: 'showBeta',
            value: lreViewSettings.showBeta,
            disabled: lreViewSettings.showBeta && !lreViewSettings.showAlpha && !lreViewSettings.showGamma,
        },
        {
            label: 'Gamma',
            key: 'showGamma',
            value: lreViewSettings.showGamma,
            disabled: lreViewSettings.showGamma && !lreViewSettings.showAlpha && !lreViewSettings.showBeta,
        },
    ];

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const sectionValue = (event.target as HTMLInputElement).value as keyof ILreViewSettings;
        setValue(sectionValue);
        save(sectionValue, true);
        const otherOptions = lreSectionOptions.filter(x => x.key !== sectionValue);
        for (const option of otherOptions) {
            save(option.key, false);
        }
    };

    const renderOption = (option: IViewOption<ILreViewSettings>) => {
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
        if (isMobile) {
            save('showAlpha', true);
            save('showBeta', false);
            save('showGamma', false);
        }
    }, []);

    return !isMobile ? (
        <div className="flex-box gap5 wrap">{lreSectionOptions.map(renderOption)}</div>
    ) : (
        <FormControl style={{ paddingLeft: 16 }}>
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
