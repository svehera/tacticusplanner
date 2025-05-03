import React, { useContext, useEffect, useMemo, useState } from 'react';

import { StoreContext } from 'src/reducers/store.provider';
import { StaticDataService } from 'src/services';
import { useQueryState } from 'src/v2/hooks/query-state';

import { useTitle } from '@/fsd/5-shared/ui/contexts';

import { LegendaryEventEnum } from '@/fsd/4-entities/lre';

import { getLre } from '@/fsd/3-features/lre';
import { LreSection } from 'src/v2/features/lre/lre.models';

export const useLre = () => {
    const { setHeaderTitle } = useTitle();
    const { characters } = useContext(StoreContext);
    const [legendaryEventId] = useQueryState<LegendaryEventEnum>(
        'character',
        initQueryParam =>
            initQueryParam
                ? (LegendaryEventEnum[initQueryParam as keyof typeof LegendaryEventEnum] as LegendaryEventEnum)
                : LegendaryEventEnum.Mephiston,
        value => LegendaryEventEnum[value]
    );

    const [section, setSection] = useQueryState<LreSection>(
        'section',
        initQueryParam => (initQueryParam ? +initQueryParam : LreSection.teams),
        value => value.toString()
    );

    const [showSettings, setShowSettings] = useState(false);

    const openSettings = () => setShowSettings(true);
    const closeSettings = () => setShowSettings(false);

    const changeTab = (_: React.SyntheticEvent, value: LreSection) => setSection(value);

    useEffect(() => {
        const relatedLre = StaticDataService.lreCharacters.find(x => x.lre!.id === legendaryEventId);
        if (relatedLre) {
            setHeaderTitle(
                relatedLre.lre!.finished
                    ? `${relatedLre.name} (Finished)`
                    : `${relatedLre.name} ${relatedLre.lre!.eventStage}/3 (${relatedLre.lre!.nextEventDate})`
            );
        }
    }, [legendaryEventId]);

    const legendaryEvent = useMemo(() => getLre(legendaryEventId, characters), [legendaryEventId]);

    return { legendaryEvent, section, showSettings, openSettings, closeSettings, changeTab };
};
