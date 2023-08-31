import { createContext } from 'react';
import { IViewPreferences } from '../models/interfaces';

export const defaultViewPreferences: IViewPreferences = {
    onlyUnlocked: false,
    usedInCampaigns: false,
    showAlpha: true,
    showBeta: true,
    showGamma: true,
};

export const ViewSettingsContext = createContext<IViewPreferences>(defaultViewPreferences);