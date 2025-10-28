import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { IconButton, Tooltip } from '@mui/material';
import { useContext } from 'react';

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
