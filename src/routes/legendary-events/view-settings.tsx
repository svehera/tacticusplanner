import React, { useCallback, useState } from 'react';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { IViewPreferences } from '../../models/interfaces';
import { usePersonalData } from '../../services';

const ViewSettings = (props: { value: IViewPreferences, valueChanges: (settings: IViewPreferences) => void }) => {
    const { updateViewSettings } = usePersonalData();
    const [preferences, setPreferences] = useState<IViewPreferences>(props.value);

    const updatePreferences = useCallback((setting: keyof IViewPreferences, value: boolean) => {

        setPreferences((previousValue) => {
            const newValue = { ...previousValue, [setting]: value };
            props.valueChanges(newValue);
            if(setting === 'lightWeight') {
                updateViewSettings(newValue);
            }
            return newValue;
        });
    }, []);

    return (
        <FormGroup style={{ display: 'flex', flexDirection: 'row' }}>
            <FormControlLabel control={<Checkbox
                checked={preferences.lightWeight}
                onChange={(event) => updatePreferences('lightWeight',event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Lightweight view"/>
            
            <FormControlLabel control={<Checkbox
                checked={preferences.showAlpha}
                disabled={!preferences.showBeta && !preferences.showGamma}
                onChange={(event) => updatePreferences('showAlpha',event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Alpha"/>

            <FormControlLabel control={<Checkbox
                checked={preferences.showBeta}
                disabled={!preferences.showAlpha && !preferences.showGamma}
                onChange={(event) => updatePreferences('showBeta',event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Beta"/>

            <FormControlLabel control={<Checkbox
                checked={preferences.showGamma}
                disabled={!preferences.showAlpha && !preferences.showBeta}
                onChange={(event) => updatePreferences('showGamma',event.target.checked)}
                inputProps={{ 'aria-label': 'controlled' }}
            />} label="Gamma"/>
        </FormGroup>
    );
};

export default ViewSettings;