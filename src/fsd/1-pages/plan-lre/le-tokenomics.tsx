import AdsClickIcon from '@mui/icons-material/AdsClick';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useContext, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';
import { AccessibleTooltip } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';
import { SupportSection } from '@/fsd/5-shared/ui/support-banner';
import { SyncButton } from '@/fsd/5-shared/ui/sync-button';

import { CharactersService } from '@/fsd/4-entities/character';

import { ILegendaryEvent, RequirementStatus } from '@/fsd/3-features/lre';
// eslint-disable-next-line import-x/no-internal-modules
import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types
import { ISnapshotCharacter } from '../input-roster-snapshots/models';
// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types
import { RosterSnapshotCharacter } from '../input-roster-snapshots/roster-snapshot-character';

import { LeBattle } from './le-battle';
import { ILeBattles, LeBattleService } from './le-battle.service';
import { useLreProgress } from './le-progress.hooks';
import { LeProgressService } from './le-progress.service';
import { LeTokenCard } from './le-token-card';
// import { LeTokenMilestoneCardGrid } from './le-token-milestone-card-grid';
import { renderRestrictions, renderTeam } from './le-token-render-utils';
import { LeTokenService } from './le-token-service';
import { LeTokenTable } from './le-token-table';
import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreTrackProgress, LeTokenCardRenderMode } from './lre.models';
import { TokenDisplay, TokenUse } from './token-estimation-service';

interface Props {
    legendaryEvent: ILegendaryEvent;
    battles: ILeBattles | undefined;
    tokens: TokenUse[];
    currentPoints: number;
    tokenDisplays: TokenDisplay[];
    tracksProgress: ILreTrackProgress[];
    showP2P: boolean;
    nextTokenCompleted: (tokenIndex: number) => void;
    nextTokenMaybe: (tokenIndex: number) => void;
    nextTokenStopped: (tokenIndex: number) => void;
    setBattleState: (
        trackId: 'alpha' | 'beta' | 'gamma',
        battleIndex: number,
        reqId: string,
        status: RequirementStatus
    ) => void;
}

/**
 * Displays the tokenomics of a Legendary Event (LE), including milestones
 * already achieved, and a table of tokens to use, and which milestones they
 * achieve.
 */
export const LeTokenomics: React.FC<Props> = ({
    legendaryEvent,
    battles,
    // tokens,
    currentPoints,
    tokenDisplays,
    tracksProgress,
    // showP2P,
    nextTokenCompleted,
    nextTokenMaybe,
    nextTokenStopped,
    setBattleState,
}: Props) => {
    const { characters: unresolvedChars, leSettings } = useContext(StoreContext);
    const { model } = useLreProgress(legendaryEvent);
    const [isFirstTokenBattleVisible, setIsFirstTokenBattleVisible] = useState<boolean>(false);

    // const projectedAdditionalPoints = tokens.reduce((sum, token) => sum + (token.incrementalPoints || 0), 0);
    // const finalProjectedPoints = currentPoints + projectedAdditionalPoints;
    const characters = CharactersService.resolveStoredCharacters(unresolvedChars);
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
        model.forceProgress?.nextTokenMillisUtc,
        model.forceProgress?.regenDelayInSeconds
    );
    const totalAdTokensRemainingInIteration = LeTokenService.getAdTokensRemainingInIteration(
        legendaryEvent,
        Date.now()
    );
    const totalFreeTokensRemaining = LeTokenService.getFreeTokensRemainingInEvent(
        legendaryEvent,
        Date.now(),
        model.forceProgress?.nextTokenMillisUtc,
        model.forceProgress?.regenDelayInSeconds
    );
    const totalAdTokensRemaining = LeTokenService.getAdTokensRemainingInEvent(legendaryEvent, Date.now());

    const progress = LeProgressService.computeProgress(model, leSettings.showP2POptions ?? true);

    const char = characters.find(c => c.snowprintId! === legendaryEvent.unitSnowprintId);
    const rarity = char?.rarity ?? Rarity.Legendary;
    const stars = char?.stars ?? RarityStars.None;

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
                <div className="flex items-center w-full justify-center gap-2">
                    <div className="relative w-40 h-6 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                        <div
                            className="h-full bg-blue-600"
                            style={{
                                width: `${Math.min(
                                    100,
                                    (progress.incrementalShards / progress.incrementalShardsGoal) * 100
                                )}%`,
                                // Optional: adds a slight round to the leading edge as it grows
                                borderTopRightRadius: '9999px',
                                borderBottomRightRadius: '9999px',
                            }}></div>
                        <span className="absolute inset-0 flex items-center justify-center w-full h-full text-xs font-medium text-gray-800 dark:text-gray-100">
                            {progress.incrementalShards} / {progress.incrementalShardsGoal}
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
                    <div className="flex gap-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                            <SyncButton showText={true} />{' '}
                        </div>
                        <div className="flex items-center gap-2">
                            {(model.forceProgress === undefined ||
                                model.forceProgress.nextTokenMillisUtc === undefined ||
                                Date.now() - model.forceProgress.nextTokenMillisUtc > 3 * 60 * 60 * 1000) && (
                                <AccessibleTooltip title="STALE DATA - PLEASE SYNC">
                                    <WarningAmberIcon color="warning" sx={{ fontSize: 24 }} />
                                </AccessibleTooltip>
                            )}
                            <AccessibleTooltip
                                title={`${model.forceProgress?.currentTokens ?? 0} Current Tokens in possession`}>
                                <div className="flex items-center gap-2">
                                    <MiscIcon icon="legendaryEventToken" width={30} height={35} />
                                    {model.forceProgress?.currentTokens ?? 0}
                                </div>
                            </AccessibleTooltip>
                        </div>
                        <div className="flex items-center gap-2">
                            <AccessibleTooltip
                                title={`${totalFreeTokensRemainingInIteration} free tokens remaining to be regenerated in this event, ${totalFreeTokensRemaining} across all events.`}>
                                <div className="flex items-center gap-2">
                                    <AutorenewIcon color="primary" sx={{ fontSize: 24 }} />{' '}
                                    {totalFreeTokensRemainingInIteration} / {totalFreeTokensRemaining}
                                </div>
                            </AccessibleTooltip>{' '}
                        </div>
                        <div className="flex items-center gap-2">
                            <AccessibleTooltip
                                title={`${totalAdTokensRemainingInIteration} ad tokens remaining to be claimed in this event, ${totalAdTokensRemaining} across all events.`}>
                                <div className="flex items-center gap-2">
                                    <AdsClickIcon color="primary" sx={{ fontSize: 24 }} />{' '}
                                    {totalAdTokensRemainingInIteration} / {totalAdTokensRemaining}
                                </div>
                            </AccessibleTooltip>{' '}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Next Token</h3>
                    </div>
                    <div className="justify-center w-full md:w-2/3 lg:w-1/2">
                        <LeTokenCard
                            token={firstToken}
                            tokenUsedDuringEventIteration={
                                LeTokenService.getIterationForToken(
                                    0,
                                    /*currentTokensRemaining=*/ 0,
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
                            onCompleteBattle={() => nextTokenCompleted(firstTokenIndex)}
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
                    setBattleState={setBattleState}
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
