import React, { useContext } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

const ThemeSwitch = () => {
    const { viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const switchToDarkTheme = () => {
        dispatch.viewPreferences({ type: 'Update', setting: 'theme', value: 'dark' });
        location.reload();
    };

    const switchToLightTheme = () => {
        dispatch.viewPreferences({ type: 'Update', setting: 'theme', value: 'light' });
        location.reload();
    };

    return (
        <IconButton color="inherit">
            {viewPreferences.theme === 'dark' ? (
                <Tooltip title="Switch to light mode">
                    <LightModeIcon onClick={() => switchToLightTheme()} />
                </Tooltip>
            ) : (
                <Tooltip title="Switch to dark mode. Warning: It is not perfect">
                    <DarkModeIcon onClick={() => switchToDarkTheme()} />
                </Tooltip>
            )}
        </IconButton>
    );
};

export default ThemeSwitch;
