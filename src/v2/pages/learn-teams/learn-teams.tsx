import { Fab, Tab, Tabs } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { useQueryState } from 'src/v2/hooks/query-state';
import { useAuth } from 'src/contexts/auth';
import { UserRole } from 'src/models/enums';
import { ICreateLearnTeam, IGetTeamsQueryParams, ILearnTeam } from 'src/v2/features/learn-teams/learn-teams.models';
import {
    approveTeamApi,
    createTeamApi,
    getTeamsApi,
    giveHonorTeamApi,
    rejectTeamApi,
    removeHonorTeamApi,
} from 'src/v2/features/learn-teams/learn-teams.endpoint';
import { Loader } from 'src/v2/components/loader';
import AddIcon from '@mui/icons-material/Add';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { CreateTeamDialog } from 'src/v2/features/learn-teams/components/create-team.dialog';
import { StoreContext } from 'src/reducers/store.provider';
import { LearnTeamCard } from 'src/v2/features/learn-teams/components/learn-team-card';
import { LearnTeamView } from 'src/v2/features/learn-teams/components/learn-team-view';
import { TeamsGroup, TeamStatus } from 'src/v2/features/learn-teams/learn-teams.enums';
import { RejectReasonDialog } from 'src/v2/features/learn-teams/components/reject-reason.dialog';
import { enqueueSnackbar } from 'notistack';
import { isMobile } from 'react-device-detect';
import { set } from 'lodash';

export const LearnTeams: React.FC = () => {
    const { characters, mows } = useContext(StoreContext);
    const { userInfo, isAuthenticated } = useAuth();
    const isModerator = [UserRole.admin, UserRole.moderator].includes(userInfo.role);
    const [openCreateTeamDialog, setOpenCreateTeamDialog] = React.useState(false);

    const [activeTab, setActiveTab] = useQueryState<number>(
        'activeTab',
        activeTabParam => (activeTabParam ? +activeTabParam : 0),
        activeTab => activeTab.toString()
    );

    const [viewTeamId, setViewTeamId] = useQueryState<number | null>(
        'teamId',
        teamIdParam => (teamIdParam ? +teamIdParam : null),
        teamId => (teamId ? teamId.toString() : '')
    );

    const [teams, setTeams] = useState<ILearnTeam[]>([]);
    const [nextQueryParams, setNextQueryParams] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const [viewTeam, setViewTeam] = useState<ILearnTeam | null>(null);
    const [moderateTeam, setModerateTeam] = useState<TeamStatus>(TeamStatus.approved);

    const loadTeams = async (queryParams: IGetTeamsQueryParams) => {
        setLoading(true);
        try {
            const params = new URLSearchParams(queryParams as Record<string, string>).toString();
            const { data: response } = await getTeamsApi(params);
            if (response) {
                setTeams(prevTeams => [...prevTeams, ...response.teams]);
                setNextQueryParams(response.next);
            }
        } catch (error) {
            console.error('Error loading teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const createTeam = async (team: ICreateLearnTeam) => {
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

    const renderMyTeams = (teamList: ILearnTeam[]) => {
        const rejectedTeams = teamList.filter(x => x.status === TeamStatus.rejected);
        const pendingTeams = teamList.filter(x => x.status === TeamStatus.pending);
        const approvedTeams = teamList.filter(x => x.status === TeamStatus.approved);

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

    const handleTeamModeration = (teamId: number, status: TeamStatus) => {
        setModerateTeam(status);
        if (status === TeamStatus.approved) {
            approveTeam(teamId);
            setViewTeam(null);
            setTeams(currentTeams => {
                if (activeTab === TeamsGroup.pending) {
                    return currentTeams.filter(x => x.teamId !== teamId);
                }
                const approvedTeam = currentTeams.find(x => x.teamId === teamId);
                if (approvedTeam) {
                    approvedTeam.status == TeamStatus.approved;
                }

                return currentTeams;
            });
        }
    };

    const handleTeamReject = (teamId: number, reason: string) => {
        setModerateTeam(TeamStatus.approved);
        rejectTeam(teamId, reason);
        setViewTeam(null);
        setTeams(currentTeams => {
            if (activeTab === TeamsGroup.pending) {
                return currentTeams.filter(x => x.teamId !== teamId);
            }
            const approvedTeam = currentTeams.find(x => x.teamId === teamId);
            if (approvedTeam) {
                approvedTeam.status == TeamStatus.rejected;
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
        const shareRoute = (isMobile ? '/mobile' : '') + `/learn/teams?teamId=${teamId}`;
        const shareLink = location.origin + shareRoute;
        navigator.clipboard.writeText(shareLink).then(r => enqueueSnackbar('Link Copied', { variant: 'success' }));
    };

    useEffect(() => {
        const initialQueryParams: IGetTeamsQueryParams = {
            page: 1,
            pageSize: 10,
            group: activeTab,
            teamId: viewTeamId || undefined,
        };
        loadTeams(initialQueryParams).then(() => {
            setViewTeamId(null);
        });
    }, [activeTab]);

    const renderTeams = (teamList: ILearnTeam[]) => {
        return (
            <div className="flex-box gap20 start wrap">
                {teamList.map(team => (
                    <LearnTeamCard
                        key={team.teamId}
                        team={team}
                        units={[...characters, ...mows]}
                        onView={() => setViewTeam(team)}
                        onShare={() => handleShare(team.teamId)}
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
                <Fab variant="extended" size="small" color="primary" aria-label="filter">
                    <FilterAltIcon />
                    Filter
                </Fab>
            </div>
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
            {loading && <Loader loading={true} />}
            {openCreateTeamDialog && (
                <CreateTeamDialog
                    units={[...characters, ...mows]}
                    onClose={() => setOpenCreateTeamDialog(false)}
                    addTeam={createTeam}
                />
            )}

            {activeTab === TeamsGroup.myTeams ? (
                renderMyTeams(teams)
            ) : (
                <div className="flex-box gap20 start wrap">{renderTeams(teams)}</div>
            )}

            {!!viewTeam && (
                <LearnTeamView
                    team={viewTeam}
                    isModerator={isModerator}
                    units={[...characters, ...mows]}
                    moderate={status => handleTeamModeration(viewTeam!.teamId, status)}
                    onClose={() => setViewTeam(null)}
                    onShare={() => handleShare(viewTeam.teamId)}
                    onHonor={honored => handleTeamHonor(viewTeam.teamId, honored)}
                />
            )}

            {moderateTeam === TeamStatus.rejected && (
                <RejectReasonDialog onClose={reason => handleTeamReject(viewTeam?.teamId ?? 0, reason)} />
            )}
        </div>
    );
};
