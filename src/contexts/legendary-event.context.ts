import { createContext } from 'react';
import { ILegendaryEvent } from '../models/interfaces';
import { LegendaryEvent } from '../models/enums';

export const LegendaryEventContext = createContext<ILegendaryEvent>({ id: LegendaryEvent.JainZar } as ILegendaryEvent);