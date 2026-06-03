import googleAnalytics from '@analytics/google-analytics';
import Analytics from 'analytics';

type AnalyticsRouteGroup = 'input' | 'plan' | 'learn' | 'misc';
type AnalyticsViewMode = 'desktop' | 'mobile';

type AnalyticsEventName =
    | 'page_view'
    | 'nav_menu_select'
    | 'login'
    | 'sign_up'
    | 'tacticus_sync_start'
    | 'tacticus_sync_complete'
    | 'data_export'
    | 'data_import'
    | 'share'
    | 'roster_unit_update'
    | 'inventory_update'
    | 'campaign_progress_update'
    | 'resource_update'
    | 'equipment_update'
    | 'xp_income_update'
    | 'onslaught_preference_update'
    | 'goal_create'
    | 'goal_update'
    | 'goal_delete'
    | 'goals_clear_all'
    | 'daily_raids_settings_save'
    | 'daily_raid_mark_complete'
    | 'daily_raids_filter_change'
    | 'bulk_goals_create'
    | 'team_create'
    | 'team_update'
    | 'team_delete'
    | 'guild_war_team_update'
    | 'guild_war_zone_update'
    | 'guild_war_deploy'
    | 'lre_team_create'
    | 'lre_team_update'
    | 'lre_progress_update'
    | 'quest_plan_update'
    | 'campaign_event_filter_change'
    | 'armageddon_shop_update'
    | 'search'
    | 'guide_open'
    | 'external_link_click';

type AnalyticsParameterValue = string | number | boolean | undefined;

export interface AnalyticsEventParameters {
    feature?: string;
    action?: string;
    view_mode?: AnalyticsViewMode;
    authenticated?: boolean;
    route_group?: AnalyticsRouteGroup;
    status?: string;
    source?: string;
    goal_type?: string;
    unit_type?: string;
    mode?: string;
    page_path?: string;
    destination_path?: string;
    destination_type?: string;
    search_location?: string;
    sync_scope?: 'player' | 'guild' | 'all';
    [key: string]: AnalyticsParameterValue;
}

const analytics = Analytics({
    app: 'Tacticus Planner',
    plugins: [
        googleAnalytics({
            measurementIds: [import.meta.env.VITE_GTAG],
        }),
    ],
});

export function getRouteGroup(pathname = globalThis.location?.pathname ?? ''): AnalyticsRouteGroup {
    const normalizedPath = pathname.replace(/^\/mobile/, '');
    const firstSegment = normalizedPath.split('/').find(Boolean);

    if (firstSegment === 'input' || firstSegment === 'plan' || firstSegment === 'learn') {
        return firstSegment;
    }

    return 'misc';
}

export function getViewMode(pathname = globalThis.location?.pathname ?? ''): AnalyticsViewMode {
    return pathname.startsWith('/mobile') ? 'mobile' : 'desktop';
}

function getAuthenticated(): boolean {
    return Boolean(globalThis.localStorage?.getItem('token'));
}

function normalizeParameters(parameters: AnalyticsEventParameters): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(parameters)) {
        if (value !== undefined) {
            result[key] = value;
        }
    }

    return result;
}

export function trackEvent(eventName: AnalyticsEventName, parameters: AnalyticsEventParameters = {}): void {
    analytics.track(
        eventName,
        normalizeParameters({
            route_group: getRouteGroup(),
            view_mode: getViewMode(),
            authenticated: getAuthenticated(),
            ...parameters,
        })
    );
}

export function trackPageView(pathname: string): void {
    trackEvent('page_view', {
        page_path: pathname,
        route_group: getRouteGroup(pathname),
        view_mode: getViewMode(pathname),
    });
}

export default analytics;
