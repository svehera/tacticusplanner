import { useEffect } from 'react';
import { isMobile } from 'react-device-detect';

let isScriptSet = false;

// Buy Me a Coffee widget
export const useBmcWidget = () => {
    useEffect(() => {
        if (isScriptSet) {
            return;
        }
        const script = document.createElement('script');
        script.dataset.name = 'BMC-Widget';
        script.dataset.cfasync = 'false';
        script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
        script.dataset.id = 'tacticusplanner';
        script.dataset.description = 'Support me on Buy me a coffee!';
        script.dataset.color = '#6655F0';
        script.dataset.position = 'Right';
        script.dataset.x_margin = '18';
        script.dataset.y_margin = isMobile ? '60' : '18';
        script.dataset.message = isMobile ? '' : 'Deploy troopers, Commander! Your support fuels our strategy';
        //Call window on load to show the image
        script.addEventListener('load', function () {
            requestAnimationFrame(() => {
                globalThis.dispatchEvent(new Event('DOMContentLoaded'));
            });
        });

        isScriptSet = true;
        document.body.append(script);

        return () => {
            isScriptSet = false;
            document.body.removeChild(script);
            let bmcButton = document.querySelector('#bmc-wbtn');
            while (bmcButton) {
                document.body.removeChild(bmcButton);
                bmcButton = document.querySelector('#bmc-wbtn');
            }
        };
    }, []);
};
