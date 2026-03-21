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
        script.setAttribute('data-name', 'BMC-Widget');
        script.setAttribute('data-cfasync', 'false');
        script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
        script.setAttribute('data-id', 'tacticusplanner');
        script.setAttribute('data-description', 'Support me on Buy me a coffee!');
        script.setAttribute('data-color', '#6655F0');
        script.setAttribute('data-position', 'Right');
        script.setAttribute('data-x_margin', '18');
        script.setAttribute('data-y_margin', isMobile ? '60' : '18');
        script.setAttribute(
            'data-message',
            isMobile ? '' : 'Deploy troopers, Commander! Your support fuels our strategy'
        );
        //Call window on load to show the image
        script.onload = function () {
            requestAnimationFrame(() => {
                window.dispatchEvent(new Event('DOMContentLoaded'));
            });
        };

        isScriptSet = true;
        document.body.appendChild(script);

        return () => {
            isScriptSet = false;
            document.body.removeChild(script);
            let bmcButton = document.getElementById('bmc-wbtn');
            while (bmcButton) {
                document.body.removeChild(bmcButton);
                bmcButton = document.getElementById('bmc-wbtn');
            }
        };
    }, []);
};
