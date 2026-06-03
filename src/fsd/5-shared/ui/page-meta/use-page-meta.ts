import { useContext } from 'react';
import { useMatches } from 'react-router-dom';

import { PageMetaContext } from './page-meta-context';
import { PageMeta } from './page-meta.types';

/**
 * Returns the active page's metadata (section, title, description).
 * Priority: dynamic override (usePageMetaOverride) > route handle > fallback.
 */
export function usePageMeta(): PageMeta {
    const matches = useMatches();
    const context = useContext(PageMetaContext);

    const fromHandle = matches.toReversed().find(m => (m.handle as PageMeta | undefined)?.title)?.handle as
        | PageMeta
        | undefined;

    return context.value ?? fromHandle ?? { title: 'Tacticus Planner' };
}
