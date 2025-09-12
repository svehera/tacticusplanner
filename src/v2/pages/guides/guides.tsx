import AddIcon from '@mui/icons-material/Add';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { Badge, Fab, Tab, Tabs } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { enqueueSnackbar } from 'notistack';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useSearchParams } from 'react-router-dom';

import { StoreContext } from 'src/reducers/store.provider';

import { useQueryState } from '@/fsd/5-shared/lib';
import { useAuth, UserRole } from '@/fsd/5-shared/model';
import { LoaderWithText } from '@/fsd/5-shared/ui';

import { MowsService } from '@/fsd/4-entities/mow';
import { IMow2 } from '@/fsd/4-entities/mow/@x/unit';

import { CreateGuideDialog } from 'src/v2/features/guides/components/create-guide.dialog';
import { EditGuideDialog } from 'src/v2/features/guides/components/edit-guide.dialog';
import { GuideCard } from 'src/v2/features/guides/components/guide-card';
import { GuideView } from 'src/v2/features/guides/components/guide-view';
import { GuidesFilter } from 'src/v2/features/guides/components/guides-filter';
import { RejectReasonDialog } from 'src/v2/features/guides/components/reject-reason.dialog';
import {
    approveTeamApi,
    createTeamApi,
    getTeamsApi,
    giveHonorTeamApi,
    rejectTeamApi,
    removeHonorTeamApi,
    updateTeamApi,
} from 'src/v2/features/guides/guides.endpoint';
import { GuidesGroup, GuidesStatus } from 'src/v2/features/guides/guides.enums';
import { ICreateGuide, IGetGuidesQueryParams, IGuide, IGuideFilter } from 'src/v2/features/guides/guides.models';

export const Guides: React.FC = () => {
    const { characters, mows } = useContext(StoreContext);
    const { userInfo, isAuthenticated } = useAuth();
    const [_, setSearchParams] = useSearchParams();

    const resolvedMows = useMemo(() => MowsService.resolveAllFromStorage(mows), [mows]);

    const isModerator = [UserRole.admin, UserRole.moderator].includes(userInfo.role);
    const [openCreateTeamDialog, setOpenCreateTeamDialog] = React.useState(false);
    const [showFilters, setShowFilters] = React.useState(false);

    const [activeTab, setActiveTab] = useQueryState<number>(
        'activeTab',
        activeTabParam => (activeTabParam ? +activeTabParam : 0),
        activeTab => activeTab.toString()
    );

    const [viewTeamId, setViewTeamId] = useQueryState<number | null>(
        'guideId',
        teamIdParam => (teamIdParam ? +teamIdParam : null),
        teamId => (teamId ? teamId.toString() : '')
    );

    const [primaryModFilter] = useQueryState<string | undefined>(
        'primaryModes',
        filterParam => filterParam ?? undefined,
        queryParam => queryParam
    );

    const [createdByFilter] = useQueryState<string | undefined>(
        'createdBy',
        filterParam => filterParam ?? undefined,
        queryParam => queryParam
    );

    const [subModFilter] = useQueryState<string[] | undefined>(
        'subModes',
        filterParam => filterParam?.split(',') ?? undefined,
        queryParam => queryParam?.join(',')
    );

    const [unitIdsFilter] = useQueryState<string[] | undefined>(
        'unitIds',
        filterParam => filterParam?.split(',') ?? undefined,
        queryParam => queryParam?.join(',')
    );

    const [teams, setTeams] = useState<IGuide[]>([]);
    const [nextQueryParams, setNextQueryParams] = useState<string | null>(null);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const [viewGuide, setViewGuide] = useState<IGuide | null>(null);
    const [editGuide, setEditGuide] = useState<IGuide | null>(null);
    const [moderateTeam, setModerateTeam] = useState<GuidesStatus>(GuidesStatus.approved);
    const [guidesFilter, setGuidesFilter] = useState<IGuideFilter>({
        primaryMod: primaryModFilter as any,
        subMods: subModFilter,
        createdBy: createdByFilter,
        unitIds: unitIdsFilter,
    });

    const filtersCount = useMemo(() => {
        let result = 0;
        if (guidesFilter.primaryMod) {
            result++;
        }

        if (guidesFilter.createdBy) {
            result++;
        }

        result += guidesFilter.subMods?.length ?? 0;
        result += guidesFilter.unitIds?.length ?? 0;

        return result;
    }, [guidesFilter]);

    const loadTeams = async (queryParams: IGetGuidesQueryParams) => {
        setLoading(true);
        try {
            for (const queryParamsKey in queryParams) {
                const value = queryParams[queryParamsKey as keyof IGetGuidesQueryParams];
                if (!value) {
                    delete queryParams[queryParamsKey as keyof IGetGuidesQueryParams];
                }
            }

            const params = new URLSearchParams(queryParams as Record<string, string>).toString();
            const { data: response } = await getTeamsApi(params);
            if (response) {
                setTeams(prevTeams => [...prevTeams, ...response.teams]);
                setNextQueryParams(response.next);
                setTotal(response.total);
            }
        } catch (error) {
            console.error('Error loading teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadNextTeams = async () => {
        if (!nextQueryParams || loading) {
            return;
        }
        setLoading(true);
        try {
            const { data: response } = await getTeamsApi(nextQueryParams);
            if (response) {
                setTeams(prev => [...prev, ...response.teams]);
                setNextQueryParams(response.next);
            }
        } catch (error) {
            console.error('Error loading teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const createTeam = async (team: ICreateGuide) => {
        setLoading(true);
        try {
            const { error } = await createTeamApi(team);
            if (error) {
                console.error('Error while creating team', error);
            }
        } catch (error) {
            console.error('Error while creating team', error);
        } finally {
            setLoading(false);
            setTeams([]);
            setActiveTab(GuidesGroup.myTeams);
            loadTeams({
                page: 1,
                pageSize: 20,
                group: GuidesGroup.myTeams,
            });
        }
    };

    const updateGuide = async (guideId: number, guide: ICreateGuide) => {
        setLoading(true);
        try {
            const { error } = await updateTeamApi(guideId, guide);
            if (error) {
                console.error('Error while updating guide', error);
            }
        } catch (error) {
            console.error('Error while updating guide', error);
        } finally {
            setLoading(false);
            setActiveTab(GuidesGroup.myTeams);
            setTeams([]);
            loadTeams({
                page: 1,
                pageSize: 20,
                group: GuidesGroup.myTeams,
            });
        }
    };

    const approveTeam = async (teamId: number) => {
        setLoading(true);
        try {
            const { error } = await approveTeamApi(teamId);
            if (error) {
                console.error('Error while approve team', error);
            }
        } catch (error) {
            console.error('Error while approve team', error);
        } finally {
            setLoading(false);
        }
    };

    const rejectTeam = async (teamId: number, reason: string) => {
        setLoading(true);
        try {
            const { error } = await rejectTeamApi(teamId, reason);
            if (error) {
                console.error('Error while reject team', error);
            }
        } catch (error) {
            console.error('Error while reject team', error);
        } finally {
            setLoading(false);
        }
    };

    const giveTeamHonor = async (teamId: number) => {
        setLoading(true);
        try {
            const { error } = await giveHonorTeamApi(teamId);
            if (error) {
                console.error('Error while honor team', error);
            }
        } catch (error) {
            console.error('Error while honor team', error);
        } finally {
            setLoading(false);
        }
    };

    const removeTeamHonor = async (teamId: number) => {
        setLoading(true);
        try {
            const { error } = await removeHonorTeamApi(teamId);
            if (error) {
                console.error('Error while remove team honor ', error);
            }
        } catch (error) {
            console.error('Error while remove team honor ', error);
        } finally {
            setLoading(false);
        }
    };

    const renderMyTeams = (teamList: IGuide[]) => {
        const rejectedTeams = teamList.filter(x => x.status === GuidesStatus.rejected);
        const pendingTeams = teamList.filter(x => x.status === GuidesStatus.pending);
        const approvedTeams = teamList.filter(x => x.status === GuidesStatus.approved);

        return (
            <div>
                {!!rejectedTeams.length && (
                    <>
                        <h3>Rejected</h3>
                        <div className="flex-box gap20 start wrap">{renderTeams(rejectedTeams)}</div>
                    </>
                )}

                {!!pendingTeams.length && (
                    <>
                        <h3>Pending</h3>
                        <div className="flex-box gap20 start wrap">{renderTeams(pendingTeams)}</div>
                    </>
                )}

                {!!approvedTeams.length && (
                    <>
                        <h3>Approved</h3>
                        <div className="flex-box gap20 start wrap">{renderTeams(approvedTeams)}</div>
                    </>
                )}
            </div>
        );
    };

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setTeams([]);
        setActiveTab(newValue);
    };

    const handleTeamModeration = (teamId: number, status: GuidesStatus) => {
        setModerateTeam(status);
        if (status === GuidesStatus.approved) {
            approveTeam(teamId);
            setViewGuide(null);
            setTeams(currentTeams => {
                if (activeTab === GuidesGroup.pending) {
                    return currentTeams.filter(x => x.teamId !== teamId);
                }
                const approvedTeam = currentTeams.find(x => x.teamId === teamId);
                if (approvedTeam) {
                    approvedTeam.status = GuidesStatus.approved;
                }

                return currentTeams;
            });
        }
    };

    const handleTeamReject = (teamId: number, reason: string) => {
        setModerateTeam(GuidesStatus.approved);
        rejectTeam(teamId, reason);
        setViewGuide(null);
        setTeams(currentTeams => {
            if (activeTab === GuidesGroup.pending) {
                return currentTeams.filter(x => x.teamId !== teamId);
            }
            const approvedTeam = currentTeams.find(x => x.teamId === teamId);
            if (approvedTeam) {
                approvedTeam.status = GuidesStatus.rejected;
            }

            return currentTeams;
        });
    };

    const handleTeamHonor = (teamId: number, honored: boolean) => {
        setTeams(currentTeams => {
            const updatedTeam = currentTeams.find(x => x.teamId === teamId);
            if (updatedTeam) {
                updatedTeam.isHonored = honored;
            }
            return [...currentTeams];
        });

        if (honored) {
            giveTeamHonor(teamId);
        } else {
            removeTeamHonor(teamId);
        }
    };

    const handleShare = (teamId: number) => {
        const shareRoute = (isMobile ? '/mobile' : '') + `/learn/guides?guideId=${teamId}`;
        const shareLink = location.origin + shareRoute;
        navigator.clipboard.writeText(shareLink).then(r => enqueueSnackbar('Link Copied', { variant: 'success' }));
    };

    const handleViewOriginal = (teamId: number | null) => {
        const route = (isMobile ? '/mobile' : '') + `/learn/guides?guideId=${teamId}`;
        const link = location.origin + route;

        window.open(link, isMobile ? '_self' : '_blank');
    };

    const handleEdit = (guide: IGuide) => {
        setEditGuide(guide);
    };

    const handleClearFilters = () => {
        setShowFilters(false);
        handleApplyFilters({
            createdBy: undefined,
            primaryMod: undefined,
            subMods: undefined,
            unitIds: undefined,
        });
    };

    const handleApplyFilters = (filter: IGuideFilter) => {
        setTeams([]);
        setNextQueryParams('');
        setGuidesFilter(filter);

        setSearchParams(curr => {
            const updatedParams = new URLSearchParams(curr);

            if (filter.subMods) {
                updatedParams.set('subModes', filter.subMods.join(','));
            } else {
                updatedParams.delete('subModes');
            }

            if (filter.primaryMod) {
                updatedParams.set('primaryModes', filter.primaryMod);
            } else {
                updatedParams.delete('primaryModes');
            }

            if (filter.unitIds) {
                updatedParams.set('unitIds', filter.unitIds.join(','));
            } else {
                updatedParams.delete('unitIds');
            }

            if (filter.createdBy) {
                updatedParams.set('createdBy', filter.createdBy);
            } else {
                updatedParams.delete('createdBy');
            }

            return updatedParams;
        });

        loadTeams({
            page: 1,
            pageSize: 20,
            group: activeTab,
            primaryModes: filter.primaryMod,
            subModes: filter.subMods,
            unitIds: filter.unitIds,
            createdBy: filter.createdBy,
        });
    };

    useEffect(() => {
        const initialQueryParams: IGetGuidesQueryParams = {
            page: 1,
            pageSize: 20,
            group: activeTab,
            guideId: viewTeamId || undefined,
            primaryModes: primaryModFilter,
            subModes: subModFilter,
            unitIds: unitIdsFilter,
            createdBy: createdByFilter,
        };
        loadTeams(initialQueryParams).then(() => {
            setViewTeamId(null);
        });
    }, [activeTab]);

    useEffect(() => {
        const handleScroll = () => {
            const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
            if (scrollTop + clientHeight >= scrollHeight - 400) {
                loadNextTeams();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [loadNextTeams]);

    const renderTeams = (teamList: IGuide[]) => {
        return (
            <div className="flex-box gap20 start wrap">
                {teamList.map(team => (
                    <GuideCard
                        key={team.teamId}
                        team={team}
                        units={[...characters, ...resolvedMows]}
                        onView={() => setViewGuide(team)}
                        onShare={() => handleShare(team.teamId)}
                        onViewOriginal={() => handleViewOriginal(team.originalTeamId)}
                        onEdit={() => handleEdit(team)}
                        onHonor={honored => handleTeamHonor(team.teamId, honored)}
                    />
                ))}
            </div>
        );
    };

    return (
        <div>
            <div className="flex-box gap10">
                <Fab
                    disabled={!isAuthenticated}
                    variant="extended"
                    size="small"
                    color="primary"
                    aria-label="add"
                    onClick={() => setOpenCreateTeamDialog(true)}>
                    <AddIcon />
                    Create Guide
                </Fab>
                <div className="flex-box gap10">
                    {filtersCount > 0 ? (
                        <>
                            <Badge badgeContent={filtersCount} color="warning">
                                <IconButton onClick={() => setShowFilters(value => !value)}>
                                    <FilterAltIcon />
                                </IconButton>
                            </Badge>
                            <Button color="error" onClick={handleClearFilters}>
                                Clear Filters
                            </Button>
                        </>
                    ) : (
                        <Button variant="outlined" onClick={() => setShowFilters(value => !value)}>
                            Filter <FilterAltOutlinedIcon />
                        </Button>
                    )}
                    <span>
                        ({teams.length} of {total})
                    </span>
                </div>
            </div>
            {showFilters && (
                <>
                    <br />
                    <GuidesFilter
                        units={[...characters, ...resolvedMows]}
                        filter={guidesFilter}
                        applyFilters={handleApplyFilters}
                    />
                    <br />
                </>
            )}
            <Tabs
                value={activeTab}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="scrollable auto tabs example">
                <Tab label="All" />
                <Tab label="Honored" disabled={!isAuthenticated} />
                <Tab label="My Teams" disabled={!isAuthenticated} />
                {isModerator && <Tab label="Pending" />}
                {isModerator && <Tab label="Rejected" />}
            </Tabs>
            {loading && <LoaderWithText loading={true} />}
            {openCreateTeamDialog && (
                <CreateGuideDialog
                    units={[...characters, ...resolvedMows]}
                    onClose={() => setOpenCreateTeamDialog(false)}
                    addTeam={createTeam}
                />
            )}

            {activeTab === GuidesGroup.myTeams ? (
                renderMyTeams(teams)
            ) : (
                <div className="flex-box gap20 start wrap">{renderTeams(teams)}</div>
            )}

            {!!viewGuide && (
                <GuideView
                    team={viewGuide}
                    units={[...characters, ...resolvedMows]}
                    moderate={status => handleTeamModeration(viewGuide!.teamId, status)}
                    onClose={() => setViewGuide(null)}
                    onShare={() => handleShare(viewGuide.teamId)}
                    onViewOriginal={() => handleViewOriginal(viewGuide.originalTeamId)}
                    onEdit={() => handleEdit(viewGuide)}
                    onHonor={honored => handleTeamHonor(viewGuide.teamId, honored)}
                />
            )}

            {!!editGuide && (
                <EditGuideDialog
                    guide={editGuide}
                    units={[...characters, ...resolvedMows]}
                    saveGuide={updated => updateGuide(editGuide?.teamId, updated)}
                    onClose={() => setEditGuide(null)}
                />
            )}

            {moderateTeam === GuidesStatus.rejected && (
                <RejectReasonDialog onClose={reason => handleTeamReject(viewGuide?.teamId ?? 0, reason)} />
            )}
        </div>
    );
};
