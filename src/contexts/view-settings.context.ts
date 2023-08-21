import { createContext } from 'react';
import { IViewPreferences } from '../store/personal-data/personal-data.interfaces';

export const defaultViewPreferences: IViewPreferences = {
    onlyUnlocked: false,
    usedInCampaigns: false
};

export const ViewSettingsContext = createContext<IViewPreferences>(defaultViewPreferences);