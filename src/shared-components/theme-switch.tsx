import React, { useContext, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';

const ThemeSwitch = () => {
    const { viewPreferences } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const switchToDarkTheme = () => {
        dispatch.viewPreferences({ type: 'Update', setting: 'theme', value: 'dark' });
    };

    const switchToLightTheme = () => {
        dispatch.viewPreferences({ type: 'Update', setting: 'theme', value: 'light' });
    };

    useEffect(() => {
        if (viewPreferences.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [viewPreferences.theme]);

    return (
        <IconButton color="inherit">
            {viewPreferences.theme === 'dark' ? (
                <Tooltip title="Switch to light mode">
                    <LightModeIcon onClick={() => switchToLightTheme()} />
                </Tooltip>
            ) : (
                <Tooltip title="Switch to dark mode">
                    <DarkModeIcon onClick={() => switchToDarkTheme()} />
                </Tooltip>
            )}
        </IconButton>
    );
};

export default ThemeSwitch;
