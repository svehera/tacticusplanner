import { createContext } from 'react';
import { IViewPreferences } from '../models/interfaces';

export const defaultViewPreferences: IViewPreferences = {
    showAlpha: true,
    showBeta: true,
    showGamma: true,
    lightWeight: false
};

export const ViewSettingsContext = createContext<IViewPreferences>(defaultViewPreferences);