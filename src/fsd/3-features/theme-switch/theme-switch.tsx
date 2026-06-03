import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

import { Theme, useTheme } from '@/fsd/5-shared/model';
import { Button, LazyTooltip } from '@/fsd/5-shared/ui';

export const ThemeSwitch = () => {
    const { userThemePreference, setUserThemePreference } = useTheme();

    switch (userThemePreference) {
        case Theme.Device: {
            return (
                <LazyTooltip title="Switch to light mode">
                    <Button
                        size="square-petite"
                        appearance="plain"
                        intent="secondary"
                        onPress={() => setUserThemePreference(Theme.Light)}>
                        <SettingsBrightnessIcon />
                    </Button>
                </LazyTooltip>
            );
        }
        case Theme.Light: {
            return (
                <LazyTooltip title="Switch to dark mode">
                    <Button
                        size="square-petite"
                        appearance="plain"
                        intent="secondary"
                        onPress={() => setUserThemePreference(Theme.Dark)}>
                        <LightModeIcon />
                    </Button>
                </LazyTooltip>
            );
        }
        case Theme.Dark: {
            return (
                <LazyTooltip title="Switch to device default">
                    <Button
                        size="square-petite"
                        appearance="plain"
                        intent="secondary"
                        onPress={() => setUserThemePreference(Theme.Device)}>
                        <DarkModeIcon />
                    </Button>
                </LazyTooltip>
            );
        }
    }
};
