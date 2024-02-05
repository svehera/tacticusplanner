import { ReactElement } from 'react';

export class MenuItem {
    constructor(
        public label: string,
        public icon: ReactElement,
        public routeWeb: string,
        public title: string = '',
        public routeMobile: string = ''
    ) {
        this.routeMobile = '/mobile' + (routeMobile || routeWeb);
        this.title = title || label;
    }
}
