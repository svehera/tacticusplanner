/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { useContext } from 'react';
import Zoom from 'react-medium-image-zoom';

import { StoreContext } from 'src/reducers/store.provider';

import { useAuth } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui';

import { LegendaryEventService } from '@/fsd/4-entities/lre';

import TokenAvailability from '@/fsd/1-pages/game-mode-tokens';

import { DailyRaidsSection } from './daily-raids-section';
import { GoalsSection } from './goals-section';
import { LreSection } from './lre-section';
import { useBmcWidget } from './use-bmc-widget';

export const DesktopHome = () => {
    useBmcWidget();
    const { userInfo } = useAuth();
    const { leProgress, characters } = useContext(StoreContext);
    const nextLeMenuItem = LegendaryEventService.getActiveEvent();

    const calendarUrls: { current?: string; next?: string } = {
        current: getImageUrl('calendar/calendar_138.webp'),
    };

    const announcements = () => {
        if (userInfo.tacticusApiKey) {
            return <></>;
        }

        return (
            <div className="px-0 pt-[25px] pb-[50px] text-center">
                <h2>Exciting News from WH40k Tacticus!</h2>
                <p>
                    We&apos;re thrilled to announce that player API keys are now available! Use your key to effortlessly
                    upload your Tacticus roster to the Planner.
                </p>
                <p>
                    For more details, check out our{' '}
                    <a href="/faq" target="_blank" rel="noreferrer">
                        FAQ
                    </a>{' '}
                    or find additional information in the user menu.
                </p>
            </div>
        );
    };

    return (
        <div className="px-4 py-4">
            {announcements()}
            <TokenAvailability />
            <div className="mt-6 flex flex-wrap items-start justify-center gap-4">
                <DailyRaidsSection />

                {nextLeMenuItem && (
                    <LreSection nextEvent={nextLeMenuItem} leProgress={leProgress} characters={characters} />
                )}

                <GoalsSection />

                <div>
                    <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                        Events calendar
                    </p>
                    <div className="flex flex-wrap justify-center gap-2.5">
                        {!!calendarUrls.current && (
                            <div className="w-full max-w-[350px]">
                                {!!calendarUrls.next && (
                                    <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                                        Current Season
                                    </p>
                                )}
                                <Zoom>
                                    <img
                                        src={calendarUrls.current}
                                        alt="Current Season Events Calendar"
                                        width={350}
                                        height={280}
                                        className="h-auto max-w-full"
                                    />
                                </Zoom>
                            </div>
                        )}

                        {!!calendarUrls.next && (
                            <div className="w-full max-w-[350px]">
                                <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--muted-fg) uppercase">
                                    Next Season
                                </p>
                                <Zoom>
                                    <img
                                        src={calendarUrls.next}
                                        alt="Next Season Events Calendar"
                                        width={350}
                                        height={280}
                                        className="h-auto max-w-full"
                                    />
                                </Zoom>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
