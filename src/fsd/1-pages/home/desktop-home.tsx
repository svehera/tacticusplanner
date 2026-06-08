/* eslint-disable import-x/no-internal-modules */
/* eslint-disable boundaries/element-types */
import { X } from 'lucide-react';
import { useContext, useState } from 'react';
import Zoom from 'react-medium-image-zoom';

import { StoreContext } from 'src/reducers/store.provider';

import { useAuth } from '@/fsd/5-shared/model';
import { getImageUrl } from '@/fsd/5-shared/ui';

import { LegendaryEventService } from '@/fsd/4-entities/lre';

import TokenAvailability from '@/fsd/1-pages/game-mode-tokens';

import { DailyRaidsSection } from './daily-raids-section';
import { GoalsSection } from './goals-section';
import { LreSection } from './lre-section';
import { dismissHomeQuestionnaire, homeQuestionnaireLink, isHomeQuestionnaireDismissed } from './questionnaire-banner';
import { useBmcWidget } from './use-bmc-widget';

export const DesktopHome = () => {
    useBmcWidget();
    const { userInfo } = useAuth();
    const { leProgress, characters } = useContext(StoreContext);
    const nextLeMenuItem = LegendaryEventService.getActiveEvent();
    const [showQuestionnaireBanner, setShowQuestionnaireBanner] = useState(() => !isHomeQuestionnaireDismissed());

    const hideQuestionnaireBanner = () => {
        dismissHomeQuestionnaire();
        setShowQuestionnaireBanner(false);
    };

    const calendarUrls: { current?: string; next?: string } = {
        current: getImageUrl('calendar/calendar_139.webp'),
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
            {showQuestionnaireBanner && (
                <div className="mx-auto mb-4 flex max-w-[720px] flex-col items-center justify-between gap-3 rounded-xl border border-(--primary)/35 bg-(--card) px-4 py-3 text-center shadow-sm transition-shadow hover:shadow-md motion-safe:animate-[pulse_900ms_ease-out_1] sm:flex-row sm:text-left">
                    <div>
                        <p className="inline-flex items-center gap-2 font-semibold">
                            <span className="size-2 rounded-full bg-(--primary) motion-safe:animate-[ping_700ms_ease-out_1]" />
                            Help improve Tacticus Planner
                        </p>
                        <p className="text-sm text-(--soft-fg)">Share feedback in the first planner questionnaire.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <a
                            href={homeQuestionnaireLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={hideQuestionnaireBanner}
                            data-testid="home-questionnaire-link"
                            className="inline-flex items-center justify-center rounded-lg bg-(--primary) px-3 py-2 text-sm font-semibold text-(--primary-fg) transition-transform hover:scale-[1.03] active:scale-[0.98]">
                            Open questionnaire
                        </a>
                        <button
                            type="button"
                            onClick={hideQuestionnaireBanner}
                            aria-label="Dismiss questionnaire"
                            data-testid="home-questionnaire-dismiss"
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-(--soft-fg) transition-colors hover:bg-(--primary)/10 hover:text-(--fg)">
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
            )}
            <TokenAvailability />
            <div className="mt-6 flex flex-wrap items-start justify-center gap-4">
                <DailyRaidsSection />

                {nextLeMenuItem && (
                    <LreSection nextEvent={nextLeMenuItem} leProgress={leProgress} characters={characters} />
                )}

                <GoalsSection />

                <div>
                    <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--soft-fg) uppercase">
                        Events calendar
                    </p>
                    <div className="flex flex-wrap justify-center gap-2.5">
                        {!!calendarUrls.current && (
                            <div className="w-full max-w-[350px]">
                                {!!calendarUrls.next && (
                                    <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--soft-fg) uppercase">
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
                                <p className="mb-1 text-center text-sm font-semibold tracking-wide text-(--soft-fg) uppercase">
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
