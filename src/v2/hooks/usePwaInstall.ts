import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

export const usePwaInstall = () => {
    const [deviceLink, setDeviceLink] = useState<string | null>(null);
    const [isInstalled, setIsInstalled] = useState<boolean>(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const userAgent = navigator.userAgent;

        if (/iPhone|iPad|iPod/i.test(userAgent)) {
            setDeviceLink(
                'https://www.cdc.gov/niosh/mining/tools/installpwa.html#cdc_generic_section_2-installing-a-pwa-on-ios'
            );
        } else if (/Android/i.test(userAgent)) {
            setDeviceLink(
                'https://www.cdc.gov/niosh/mining/tools/installpwa.html#cdc_generic_section_3-installing-a-pwa-on-android'
            );
        }
        if (isMobile) {
            try {
                // @ts-expect-error window.navigator.standalone is available only in Safari
                setIsInstalled(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
            } catch (error) {
                console.log(error);
            }
        }

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    return { isInstalled, deviceLink, deferredPrompt };
};
