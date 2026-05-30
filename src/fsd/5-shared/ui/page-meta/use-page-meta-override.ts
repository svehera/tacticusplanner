import { useContext, useEffect } from 'react';

import { PageMetaContext } from './page-meta-context';
import { PageMeta } from './page-meta.types';

/**
 * Call from a page component to override the static route `handle` with a
 * dynamic description (e.g. a live item count). Cleans up on unmount.
 */
export function usePageMetaOverride(meta?: PageMeta) {
    const { set } = useContext(PageMetaContext);
    const section = meta?.section;
    const title = meta?.title;
    const description = meta?.description;
    useEffect(() => {
        set(title === undefined ? undefined : { section, title, description });
        return () => set(undefined);
    }, [set, section, title, description]);
}
