import AdsClickIcon from '@mui/icons-material/AdsClick';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useContext, useEffect, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { SupportSection } from '@/fsd/5-shared/ui/support-banner';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';

import { ILegendaryEvent, RequirementStatus } from '@/fsd/3-features/lre';
// eslint-disable-next-line import-x/no-internal-modules
import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types
import { ISnapshotCharacter } from '../input-roster-snapshots/models';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types
import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { LeBattle } from './le-battle';
import { ILeBattles, LeBattleService } from './le-battle.service';
import { LeTokenCard } from './le-token-card';
// import { LeTokenMilestoneCardGrid } from './le-token-milestone-card-grid';
import { renderRestrictions, renderTeam } from './le-token-render-utils';
import { LeTokenService } from './le-token-service';
import { LeTokenTable } from './le-token-table';
import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreProgressModel, ILreTrackProgress, LeTokenCardRenderMode } from './lre.models';
import { TokenDisplay, TokenEstimationService, TokenUse } from './token-estimation-service';

interface Props {
    legendaryEvent: ILegendaryEvent;
    battles: ILeBattles | undefined;
    model: ILreProgressModel;
    tokens: TokenUse[];
    currentPoints: number;
    tokenDisplays: TokenDisplay[];
    tracksProgress: ILreTrackProgress[];
    showP2P: boolean;
    nextTokenMaybe: (tokenIndex: number) => void;
    nextTokenStopped: (tokenIndex: number) => void;
    createNewModel: (
        model: ILreProgressModel,
        trackId: 'alpha' | 'beta' | 'gamma',
        battleIndex: number,
        reqId: string,
        status: RequirementStatus,
        forceOverwrite?: boolean
    ) => ILreProgressModel;
    updateDto: (model: ILreProgressModel) => void;
}

/**
 * Displays the tokenomics of a Legendary Event (LE), including milestones
 * already achieved, and a table of tokens to use, and which milestones they
 * achieve.
 */
export const LeTokenomics: React.FC<Props> = ({
    legendaryEvent,
    battles,
    model,
    // tokens,
    currentPoints,
    tokenDisplays,
    tracksProgress,
    // showP2P,
    nextTokenMaybe,
    nextTokenStopped,
    createNewModel,
    updateDto,
}: Props) => {
    const { characters: unresolvedChars } = useContext(StoreContext);
    const [isFirstTokenBattleVisible, setIsFirstTokenBattleVisible] = useState<boolean>(false);

    const [characters, setCharacters] = useState<ICharacter2[]>([]);

    useEffect(() => {
        const resolvedChars = CharactersService.resolveStoredCharacters(unresolvedChars);
        setCharacters(resolvedChars);
    }, [unresolvedChars]);

    /*
    const missedMilestones = milestonesAndPoints
        .filter(milestone => milestone.points > finalProjectedPoints && (showP2P || milestone.packsPerRound === 0))
        .sort((a, b) => a.points - b.points);
    const achievedMilestones = milestonesAndPoints.filter(
        milestone => currentPoints >= milestone.points && (showP2P || milestone.packsPerRound === 0)
    );
    */
    // Helper function to check if a token has yellow or red restrictions
    const hasWarningRestrictions = (token: TokenDisplay): boolean => {
        return token.restricts.some(restrict => {
            const status = LreRequirementStatusService.getRequirementStatus(
                tracksProgress,
                token.track as 'alpha' | 'beta' | 'gamma',
                token.battleNumber,
                restrict.id
            );
            return status === RequirementStatus.MaybeClear || status === RequirementStatus.StopHere;
        });
    };

    // Find the first token that doesn't have yellow/red restrictions
    const firstToken = tokenDisplays.find(token => !hasWarningRestrictions(token)) ?? null;
    const firstTokenIndex = firstToken ? tokenDisplays.indexOf(firstToken) : -1;

    const totalFreeTokensRemainingInIteration = LeTokenService.getFreeTokensRemainingInIteration(
        legendaryEvent,
        Date.now(),
        model.syncedProgress?.currentTokens ?? 0,
        model.syncedProgress?.nextTokenMillisUtc,
        model.syncedProgress?.regenDelayInSeconds
    );
    const totalAdTokensRemainingInIteration = LeTokenService.getAdTokensRemainingInIteration(
        legendaryEvent,
        model.syncedProgress?.hasUsedAdForExtraTokenToday ?? true,
        Date.now()
    );
    const totalFreeTokensRemaining = LeTokenService.getFreeTokensRemainingInEvent(
        legendaryEvent,
        Date.now(),
        model.syncedProgress?.currentTokens ?? 0,
        model.syncedProgress?.nextTokenMillisUtc,
        model.syncedProgress?.regenDelayInSeconds
    );
    const totalAdTokensRemaining = LeTokenService.getAdTokensRemainingInEvent(
        legendaryEvent,
        model.syncedProgress?.hasUsedAdForExtraTokenToday ?? false,
        Date.now()
    );

    const character = characters.find(c => c.snowprintId! === legendaryEvent.unitSnowprintId);
    const rank = character?.rank ?? Rank.Locked;

    const progress = TokenEstimationService.computeCurrentProgress(
        model,
        rank === Rank.Locked ? Rarity.Legendary : (character?.rarity ?? Rarity.Legendary),
        rank === Rank.Locked ? RarityStars.None : (character?.stars ?? RarityStars.None),
        /*p2p=*/ true
    );

    const char = characters.find(c => c.snowprintId! === legendaryEvent.unitSnowprintId);
    const rarity = char?.rarity ?? Rarity.Legendary;
    const stars = char?.stars ?? RarityStars.None;

    const isDataStale = () => {
        const nextEventDateUtc: Date = new Date(legendaryEvent.nextEventDateUtc ?? 0);
        if (model.syncedProgress === undefined) return true;
        if (model.syncedProgress.nextTokenMillisUtc === undefined) return false;
        if (Date.now() < nextEventDateUtc.getTime()) return false;
        if (Date.now() > nextEventDateUtc.getTime() + 7 * 86400 * 1000) return false;
        // It's been long enough for a token to regenerate, so either the token count is wrong or
        // the tokenomics data is wrong (most likely).
        return Date.now() - model.syncedProgress.lastUpdateMillisUtc > 3 * 3600 * 1000;
    };

    const shardBarWidth =
        progress.shardsForNextMilestone === Infinity
            ? 100
            : Math.min(100, (progress.shards / progress.shardsForNextMilestone) * 100);

    const characterPortrait = () => {
        return (
            <div className="flex flex-col items-center">
                {/* Character Icon Container */}
                <div>
                    {char !== undefined && (
                        <RosterSnapshotCharacter
                            showShards={RosterSnapshotShowVariableSettings.Never}
                            showMythicShards={RosterSnapshotShowVariableSettings.Never}
                            showXpLevel={RosterSnapshotShowVariableSettings.Never}
                            showAbilities={false}
                            char={
                                {
                                    id: char.snowprintId!,
                                    rank: char.rank,
                                    rarity: rarity,
                                    stars: stars,
                                    shards: 0,
                                    mythicShards: 0,
                                    activeAbilityLevel: 1,
                                    passiveAbilityLevel: 1,
                                    xpLevel: 1,
                                } as ISnapshotCharacter
                            }
                            charData={char}
                        />
                    )}
                </div>
                <div className="flex items-center justify-center w-full gap-2">
                    <div className="relative w-40 h-6 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
                        <div
                            className="h-full bg-blue-600"
                            style={{
                                width: `${shardBarWidth}%`,
                                // Optional: adds a slight round to the leading edge as it grows
                                borderTopRightRadius: '9999px',
                                borderBottomRightRadius: '9999px',
                            }}></div>
                        <span className="absolute inset-0 flex items-center justify-center w-full h-full text-xs font-medium text-gray-800 dark:text-gray-100">
                            {progress.shards} / {progress.shardsForNextMilestone}
                        </span>
                    </div>
                </div>
                <div className="flex mt-2">
                    <MiscIcon icon="leShard" width={40} height={40} />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full gap-y-8">
            {firstToken && (
                <div className="flex flex-col items-center w-full gap-y-4">
                    <div className="flex flex-col items-center w-full gap-y-4">
                        {/* Token status and sync section */}
                        <div className="flex items-center justify-center w-full min-h-10">
                            <div className="flex text-sm text-gray-600 gap-x-8 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <SyncButton showText={true} />
                                </div>
                                <div className="flex items-center gap-2">
                                    {isDataStale() && (
                                        <AccessibleTooltip title="STALE DATA - PLEASE SYNC">
                                            <WarningAmberIcon color="warning" sx={{ fontSize: 24 }} />
                                        </AccessibleTooltip>
                                    )}
                                    <AccessibleTooltip
                                        title={`${model.syncedProgress?.currentTokens ?? 0} Current Tokens in possession`}>
                                        <div className="flex items-center gap-2">
                                            <MiscIcon icon="legendaryEventToken" width={30} height={35} />
                                            {model.syncedProgress?.currentTokens ?? 0}
                                        </div>
                                    </AccessibleTooltip>
                                </div>

                                <div className="flex items-center gap-2">
                                    <AccessibleTooltip
                                        title={`${Math.max(0, totalFreeTokensRemainingInIteration - (model.syncedProgress?.currentTokens ?? 0))} free tokens remaining...`}>
                                        <div className="flex items-center gap-2">
                                            <AutorenewIcon color="primary" sx={{ fontSize: 24 }} />
                                            {Math.max(
                                                0,
                                                totalFreeTokensRemainingInIteration -
                                                    (model.syncedProgress?.currentTokens ?? 0)
                                            )}{' '}
                                            /{' '}
                                            {Math.max(
                                                0,
                                                totalFreeTokensRemaining - (model.syncedProgress?.currentTokens ?? 0)
                                            )}
                                        </div>
                                    </AccessibleTooltip>
                                </div>

                                <div className="flex items-center gap-2">
                                    <AccessibleTooltip
                                        title={`${totalAdTokensRemainingInIteration} ad tokens remaining...`}>
                                        <div className="flex items-center gap-2">
                                            <AdsClickIcon color="primary" sx={{ fontSize: 24 }} />
                                            {totalAdTokensRemainingInIteration} / {totalAdTokensRemaining}
                                        </div>
                                    </AccessibleTooltip>
                                </div>
                            </div>
                        </div>

                        {/* rest of your code... */}
                    </div>{' '}
                    <div>
                        <h3 className="text-lg font-bold">Next Token</h3>
                    </div>
                    <div className="justify-center w-full md:w-2/3 lg:w-1/2">
                        <LeTokenCard
                            token={firstToken}
                            tokenUsedDuringEventIteration={
                                LeTokenService.getIterationForToken(
                                    0,
                                    model.syncedProgress?.currentTokens ?? 0,
                                    model.syncedProgress?.hasUsedAdForExtraTokenToday ?? true,
                                    legendaryEvent,
                                    model.occurrenceProgress[0].premiumMissionsProgress > 0,
                                    model.occurrenceProgress[1].premiumMissionsProgress > 0,
                                    model.occurrenceProgress[2].premiumMissionsProgress > 0,
                                    Date.now()
                                ) ?? 3
                            }
                            index={firstTokenIndex}
                            renderMode={LeTokenCardRenderMode.kStandalone}
                            currentPoints={currentPoints}
                            renderRestrictions={x =>
                                renderRestrictions(
                                    x,
                                    tracksProgress,
                                    firstToken.track as 'alpha' | 'beta' | 'gamma',
                                    firstToken.battleNumber,
                                    35
                                )
                            }
                            renderTeam={x => renderTeam(x, 30)}
                            isBattleVisible={isFirstTokenBattleVisible}
                            onToggleBattle={() => setIsFirstTokenBattleVisible(!isFirstTokenBattleVisible)}
                            onMaybeBattle={() => nextTokenMaybe(firstTokenIndex)}
                            onStopBattle={() => nextTokenStopped(firstTokenIndex)}
                        />
                        {isFirstTokenBattleVisible &&
                            LeBattleService.getBattleFromToken(firstToken, battles) !== undefined && (
                                <div className="w-full mt-4">
                                    <LeBattle
                                        battle={LeBattleService.getBattleFromToken(firstToken, battles)!}
                                        trackName={firstToken.track}
                                    />
                                </div>
                            )}
                        {isFirstTokenBattleVisible &&
                            LeBattleService.getBattleFromToken(firstToken, battles) === undefined && (
                                <div className="w-full p-4 mt-4 text-center text-gray-600 border border-gray-300 dark:text-gray-500 dark:border-gray-700 rounded-xl">
                                    Battle data not available.
                                </div>
                            )}
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-y-8">
                <SupportSection />
            </div>

            <div className="flex flex-col items-center w-full gap-y-4">{characterPortrait()}</div>

            {/*showP2P && (
                <div className="flex flex-col items-center w-full gap-y-4">
                    <div>
                        <h3 className="text-lg font-bold">Milestones Already Achieved</h3>
                    </div>
                    <LeTokenMilestoneCardGrid
                        milestonesToList={achievedMilestones}
                        emptyMessage="No milestones achieved yet."
                    />
                </div>
            )*/}

            <div key="tokens" className="flex flex-col w-full gap-2">
                <LeTokenTable
                    battles={battles}
                    legendaryEvent={legendaryEvent}
                    progress={model}
                    tokenDisplays={tokenDisplays}
                    tracksProgress={tracksProgress}
                    createNewModel={createNewModel}
                    updateDto={updateDto}
                />
            </div>
            {/*missedMilestones.length > 0 && (
                <div className="flex flex-col items-center w-full pt-6 mt-4 border-t-2 border-gray-200 gap-y-4 dark:border-gray-700">
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
                            Milestones Projected to Miss
                        </h3>
                        <p className="text-sm text-gray-500">
                            Based on current points ({currentPoints}) + tokens listed above (+
                            {projectedAdditionalPoints})
                        </p>
                    </div>

                    <LeTokenMilestoneCardGrid
                        milestonesToList={missedMilestones}
                        emptyMessage=""
                        isMissedVariant={true}
                    />
                </div>
            )*/}
        </div>
    );
};
