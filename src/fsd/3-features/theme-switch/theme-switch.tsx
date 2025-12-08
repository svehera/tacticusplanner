import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MonitorIcon from '@mui/icons-material/Monitor';
import { IconButton, Tooltip } from '@mui/material';

import { Theme, useTheme } from '@/fsd/5-shared/model';

export const ThemeSwitch = () => {
    const { userThemePreference, setUserThemePreference } = useTheme();

    switch (userThemePreference) {
        case Theme.Device:
            return (
                <Tooltip title="Switch to light mode">
                    <IconButton onClick={() => setUserThemePreference(Theme.Light)}>
                        <MonitorIcon />
                    </IconButton>
                </Tooltip>
            );
        case Theme.Light:
            return (
                <Tooltip title="Switch to dark mode">
                    <IconButton onClick={() => setUserThemePreference(Theme.Dark)}>
                        <LightModeIcon />
                    </IconButton>
                </Tooltip>
            );
        case Theme.Dark:
            return (
                <Tooltip title="Switch to device default">
                    <IconButton onClick={() => setUserThemePreference(Theme.Device)}>
                        <DarkModeIcon />
                    </IconButton>
                </Tooltip>
            );
    }
};
