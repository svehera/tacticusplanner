import React, { useState } from 'react';

import { PageMetaContext } from './page-meta-context';
import { PageMeta } from './page-meta.types';

export function PageMetaProvider({ children }: { children: React.ReactNode }) {
    const [value, setValue] = useState<PageMeta | undefined>();
    return <PageMetaContext.Provider value={{ set: setValue, value }}>{children}</PageMetaContext.Provider>;
}
