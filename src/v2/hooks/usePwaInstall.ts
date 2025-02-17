import { useEffect, useState } from 'react';

export const usePwaInstall = () => {
    const [deviceLink, setDeviceLink] = useState<string>('https://www.cdc.gov/niosh/mining/tools/installpwa.html');
    const [isInstalled, setIsInstalled] = useState<boolean>(false);

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

        try {
            // @ts-expect-error window.navigator.standalone is available only in Safari
            setIsInstalled(window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone);
        } catch (error) {
            console.log(error);
        }
    }, []);

    return { isInstalled, deviceLink };
};
