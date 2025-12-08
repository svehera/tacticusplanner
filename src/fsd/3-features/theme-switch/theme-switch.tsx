import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MonitorIcon from '@mui/icons-material/Monitor';
import { IconButton, Tooltip } from '@mui/material';

import { Theme, useTheme } from '@/fsd/5-shared/model';

export const ThemeSwitch = () => {
    const { userThemePreference, setUserThemePreference } = useTheme();

    const rotatingButtonMode = () => {
        switch (userThemePreference) {
            case Theme.Device:
                return (
                    <Tooltip title="Switch to light mode">
                        <MonitorIcon onClick={() => setUserThemePreference(Theme.Light)} />
                    </Tooltip>
                );
            case Theme.Light:
                return (
                    <Tooltip title="Switch to dark mode">
                        <LightModeIcon onClick={() => setUserThemePreference(Theme.Dark)} />
                    </Tooltip>
                );
            case Theme.Dark:
                return (
                    <Tooltip title="Switch to device default">
                        <DarkModeIcon onClick={() => setUserThemePreference(Theme.Device)} />
                    </Tooltip>
                );
        }
    };

    return <IconButton color="inherit">{rotatingButtonMode()}</IconButton>;
};
