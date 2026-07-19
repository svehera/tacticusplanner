export interface IProductCalendarOffer {
    variant: string;
    title: string;
    banner: string;
    free: boolean;
    priceCents: number;
    rewards: string[];
}

export interface IProductCalendarDay {
    day: number;
    offers: IProductCalendarOffer[];
}

export interface IProductCalendar {
    calendar: string;
    days: IProductCalendarDay[];
}
