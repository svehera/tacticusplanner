import React, { useContext, useEffect, useMemo, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { LegendaryEventDefaultPage } from '@/models/interfaces';
// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { useQueryState } from '@/fsd/5-shared/lib';
import { useTitle } from '@/fsd/5-shared/ui/contexts';

import { CharactersService } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, LegendaryEventService } from '@/fsd/4-entities/lre';

import { getLre } from '@/fsd/3-features/lre';

import { LreSection } from './lre.models';

export const useLre = () => {
    const { setHeaderTitle } = useTitle();
    const { characters, leSettings } = useContext(StoreContext);

    const [legendaryEventId] = useQueryState<LegendaryEventEnum>(
        'character',
        initQueryParam =>
            initQueryParam
                ? (LegendaryEventEnum[initQueryParam as keyof typeof LegendaryEventEnum] as LegendaryEventEnum)
                : LegendaryEventEnum.Mephiston,
        value => LegendaryEventEnum[value]
    );

    const isEventActive = LegendaryEventService.getActiveEvent()?.id === legendaryEventId;

    const mapDefaultToPage = (page: LegendaryEventDefaultPage) => {
        switch (page) {
            case LegendaryEventDefaultPage.TEAMS:
                return LreSection.teams;
            case LegendaryEventDefaultPage.PROGRESS:
                return LreSection.progress;
            case LegendaryEventDefaultPage.TOKENOMICS:
                return LreSection.tokenomics;
        }
        return LreSection.teams;
    };

    const getDefaultPage = () =>
        isEventActive
            ? mapDefaultToPage(leSettings.defaultPageForActiveEvent)
            : mapDefaultToPage(leSettings.defaultPageWhenEventNotActive);
    const [section, setSection] = useQueryState<LreSection>(
        'section',
        initQueryParam => (initQueryParam ? +initQueryParam : getDefaultPage()),
        value => value.toString()
    );

    useEffect(() => {
        const url = new URL(window.location.href);
        if (!url.searchParams.has('section')) {
            setSection(getDefaultPage());
        }
    }, [legendaryEventId, leSettings]);

    const [showSettings, setShowSettings] = useState(false);

    const openSettings = () => setShowSettings(true);
    const closeSettings = () => setShowSettings(false);

    const changeTab = (_: React.SyntheticEvent, value: LreSection) => setSection(value);

    useEffect(() => {
        const lreChar = CharactersService.getLreCharacter(legendaryEventId);
        if (lreChar) {
            const relatedLre = LegendaryEventService.getEventByCharacterSnowprintId(lreChar!.snowprintId!);
            const nextDate = relatedLre?.nextEventDate ?? 'TBA';
            setHeaderTitle(
                !relatedLre || relatedLre.finished
                    ? `${lreChar.name} (Finished)`
                    : `${lreChar.name} ${relatedLre!.eventStage}/3 (${nextDate})`
            );
        }
    }, [characters, legendaryEventId]);

    const legendaryEvent = useMemo(() => getLre(legendaryEventId, characters), [legendaryEventId]);

    return { legendaryEvent, section, showSettings, openSettings, closeSettings, changeTab };
};
