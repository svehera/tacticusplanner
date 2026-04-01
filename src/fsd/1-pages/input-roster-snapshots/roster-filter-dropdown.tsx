import ChevronRight from '@mui/icons-material/ChevronRight';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
    Button,
    Checkbox,
    Collapse,
    Divider,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Typography,
} from '@mui/material';
import { Fragment, ReactNode, useMemo, useState } from 'react';

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

type SectionId = 'teams' | 'teamTypes' | 'legendaryEvents';

export interface RosterFilterTeamOption {
    name: string;
    isSelected: boolean;
}

export interface RosterFilterTeamTypeOption {
    token: string;
    label: string;
    isSelected: boolean;
    disabled: boolean;
}

export interface RosterFilterLegendaryTrackOption {
    token: string;
    label: string;
    isSelected: boolean;
    disabled: boolean;
}

export interface RosterFilterLegendaryEventOption {
    id: string | number;
    label: string;
    icon: string;
    tracks: RosterFilterLegendaryTrackOption[];
}

interface RosterFilterDropdownProps {
    summaryLabel: string;
    teams: RosterFilterTeamOption[];
    teamTypes: RosterFilterTeamTypeOption[];
    legendaryEvents: RosterFilterLegendaryEventOption[];
    renderTeamIcons: (teamName: string) => ReactNode;
    onToggleTeam: (teamName: string) => void;
    onToggleTeamType: (token: string) => void;
    onToggleLegendaryTrack: (token: string) => void;
}

const sectionTitleMap: Record<SectionId, string> = {
    teams: 'Teams',
    teamTypes: 'Team Types',
    legendaryEvents: 'Legendary Events',
};

export const RosterFilterDropdown = ({
    summaryLabel,
    teams,
    teamTypes,
    legendaryEvents,
    renderTeamIcons,
    onToggleTeam,
    onToggleTeamType,
    onToggleLegendaryTrack,
}: RosterFilterDropdownProps) => {
    const [anchorElement, setAnchorElement] = useState<HTMLElement | undefined>();
    const [expandedSection, setExpandedSection] = useState<SectionId | undefined>();
    const [expandedLegendaryEvent, setExpandedLegendaryEvent] = useState<string | undefined>();

    const isOpen = Boolean(anchorElement);

    const teamTypeSelectedCount = useMemo(() => teamTypes.filter(option => option.isSelected).length, [teamTypes]);
    const teamSelectedCount = useMemo(() => teams.filter(option => option.isSelected).length, [teams]);
    const legendarySelectedCount = useMemo(
        () => legendaryEvents.flatMap(event => event.tracks).filter(track => track.isSelected).length,
        [legendaryEvents]
    );

    const toggleSection = (sectionId: SectionId) => {
        setExpandedSection(current => (current === sectionId ? undefined : sectionId));

        if (sectionId !== 'legendaryEvents') {
            setExpandedLegendaryEvent(undefined);
        }
    };

    const toggleLegendaryEvent = (eventId: string | number) => {
        const eventKey = String(eventId);
        setExpandedLegendaryEvent(current => (current === eventKey ? undefined : eventKey));
    };

    const getSectionCount = (sectionId: SectionId) => {
        if (sectionId === 'teams') {
            return teamSelectedCount;
        }

        if (sectionId === 'teamTypes') {
            return teamTypeSelectedCount;
        }

        return legendarySelectedCount;
    };

    return (
        <>
            <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={event => setAnchorElement(event.currentTarget)}
                sx={{
                    textTransform: 'none',
                    justifyContent: 'space-between',
                    minWidth: 220,
                    maxWidth: 280,
                }}>
                <span>{summaryLabel}</span>
                <ExpandMore className="ml-1" />
            </Button>
            <Menu
                anchorEl={anchorElement}
                open={isOpen}
                onClose={() => setAnchorElement(undefined)}
                PaperProps={{
                    sx: {
                        width: 'min(92vw, 360px)',
                        maxHeight: '72vh',
                    },
                }}>
                {(['teams', 'teamTypes', 'legendaryEvents'] as SectionId[]).map(sectionId => {
                    const isSectionExpanded = expandedSection === sectionId;
                    const selectedCount = getSectionCount(sectionId);

                    return (
                        <div key={sectionId}>
                            <MenuItem onClick={() => toggleSection(sectionId)}>
                                <ListItemIcon>
                                    {isSectionExpanded ? (
                                        <ExpandMore fontSize="small" />
                                    ) : (
                                        <ChevronRight fontSize="small" />
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={sectionTitleMap[sectionId]}
                                    secondary={selectedCount > 0 ? `${selectedCount} selected` : undefined}
                                />
                            </MenuItem>
                            <Collapse in={isSectionExpanded} timeout="auto" unmountOnExit>
                                {sectionId === 'teams' &&
                                    teams.map(team => (
                                        <MenuItem
                                            key={team.name}
                                            dense
                                            onClick={() => onToggleTeam(team.name)}
                                            className="pl-10">
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={team.isSelected}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <div className="flex w-full flex-col">
                                                <ListItemText primary={team.name} />
                                                <div className="mt-1">{renderTeamIcons(team.name)}</div>
                                            </div>
                                        </MenuItem>
                                    ))}

                                {sectionId === 'teamTypes' &&
                                    teamTypes.map(option => (
                                        <MenuItem
                                            key={option.token}
                                            dense
                                            onClick={() => onToggleTeamType(option.token)}
                                            disabled={option.disabled}
                                            className="pl-10">
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={option.isSelected}
                                                    tabIndex={-1}
                                                    disableRipple
                                                    disabled={option.disabled}
                                                />
                                            </ListItemIcon>
                                            <ListItemText primary={option.label} />
                                        </MenuItem>
                                    ))}

                                {sectionId === 'legendaryEvents' &&
                                    legendaryEvents.map(event => {
                                        const eventKey = String(event.id);
                                        const isEventExpanded = expandedLegendaryEvent === eventKey;
                                        const selectedTracks = event.tracks.filter(track => track.isSelected).length;
                                        const hasTracks = event.tracks.length > 0;

                                        return (
                                            <Fragment key={eventKey}>
                                                <MenuItem
                                                    dense
                                                    onClick={() => hasTracks && toggleLegendaryEvent(event.id)}
                                                    disabled={!hasTracks}
                                                    className="pl-10">
                                                    <ListItemIcon>
                                                        {hasTracks ? (
                                                            isEventExpanded ? (
                                                                <ExpandMore fontSize="small" />
                                                            ) : (
                                                                <ChevronRight fontSize="small" />
                                                            )
                                                        ) : undefined}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={event.label}
                                                        secondary={
                                                            selectedTracks > 0
                                                                ? `${selectedTracks} selected`
                                                                : undefined
                                                        }
                                                    />
                                                    {event.icon ? (
                                                        <UnitShardIcon icon={event.icon} height={24} width={24} />
                                                    ) : undefined}
                                                </MenuItem>
                                                <Collapse in={isEventExpanded} timeout="auto" unmountOnExit>
                                                    {event.tracks.map(track => (
                                                        <MenuItem
                                                            key={track.token}
                                                            dense
                                                            onClick={() => onToggleLegendaryTrack(track.token)}
                                                            disabled={track.disabled}
                                                            className="pl-16">
                                                            <ListItemIcon>
                                                                <Checkbox
                                                                    edge="start"
                                                                    checked={track.isSelected}
                                                                    tabIndex={-1}
                                                                    disableRipple
                                                                    disabled={track.disabled}
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText primary={track.label} />
                                                        </MenuItem>
                                                    ))}
                                                </Collapse>
                                            </Fragment>
                                        );
                                    })}
                            </Collapse>
                            <Divider />
                        </div>
                    );
                })}
                <div className="px-3 py-2">
                    <Typography variant="caption" color="text.secondary">
                        Tip: expand a section, then tap options to toggle filters.
                    </Typography>
                </div>
            </Menu>
        </>
    );
};
