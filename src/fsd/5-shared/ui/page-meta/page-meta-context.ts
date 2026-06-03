import { createContext } from 'react';

import { PageMeta } from './page-meta.types';

export interface PageMetaContextValue {
    set: (m?: PageMeta) => void;
    value?: PageMeta;
}

export const PageMetaContext = createContext<PageMetaContextValue>(undefined!);
