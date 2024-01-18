import { createContext } from 'react';

import { IDispatchContext, IGlobalState } from '../models/interfaces';

export const StoreContext = createContext<IGlobalState>({} as any);
export const DispatchContext = createContext<IDispatchContext>({} as any);
