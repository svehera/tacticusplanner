import { createContext } from 'react';
import { ILegendaryEvent } from '../models/interfaces';
import { defaultLE } from '../models/constants';

export const LegendaryEventContext = createContext<ILegendaryEvent>({ id: defaultLE } as ILegendaryEvent);