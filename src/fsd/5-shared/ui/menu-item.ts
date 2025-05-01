export class MenuItemTP {
    constructor(
        public label: string,
        public icon: React.ReactNode,
        public routeWeb: string,
        public title: string = '',
        public routeMobile: string = '',
        public subMenu: MenuItemTP[] = []
    ) {
        this.routeMobile = '/mobile' + (routeMobile || routeWeb);
        this.title = title || label;
    }
}
