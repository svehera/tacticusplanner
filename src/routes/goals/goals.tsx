import Button from '@mui/material/Button';
import React, { useMemo, useRef, useState } from 'react';
import { SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import { IPersonalGoal } from '../../models/interfaces';
import Box from '@mui/material/Box';
import { PersonalGoalType, Rank, Rarity } from '../../models/enums';

import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { fitGridOnWindowResize } from '../../shared-logic/functions';
import { useCharacters, usePersonalData } from '../../services';
import GoalOptionsCell from './goal-options-cell';
import { isMobile } from 'react-device-detect';
import { RankImage } from '../../shared-components/rank-image';
import { RarityImage } from '../../shared-components/rarity-image';
import { Tooltip } from '@fluentui/react-components';
import { TextWithTooltip } from '../../shared-components/text-with-tooltip';


export interface IPersonalGoalRow {
    goalId: string;
    character: string;
    goalType: string;
    current: string;
    goal: string;
    notes?: string;
}

export const Goals = () => {
    const { characters } = useCharacters();
    const { personalData, updateGoals } = usePersonalData();
    const gridRef = useRef<AgGridReact>(null);
    const goalsLimit = 20;
    const [goals, setGoals] = useState<IPersonalGoal[]>(() => personalData.goals);
    const [showSetGoals, setShowSetGoals] = useState(false);


    const disableNewGoals = useMemo(() => goals.length === goalsLimit, [goals.length]);

    const addGoal = (goal: IPersonalGoal | undefined): void => {
        if (goal) {
            setGoals(currentGoals => {
                const result = [...currentGoals, goal];
                updateGoals(result);
                return result;
            });
        }
    };

    const removeGoal = (goalId: string): void => {
        setGoals(currentGoals => {
            const result = currentGoals.filter(goal => goal.id !== goalId);
            updateGoals(result);
            return result;
        });
    };

    const reorderGoal = (goalId: string, position: number): void => {
        setGoals(currentGoals => {
            // Find the goal you want to reorder by its id
            const goalToReorder = currentGoals.find((goal) => goal.id === goalId);

            if (!goalToReorder) {
                return currentGoals;
            }

            // Remove the goal from its current position
            const currentIndex = currentGoals.indexOf(goalToReorder);
            if (currentIndex === -1) {
                return currentGoals;
            }

            currentGoals.splice(currentIndex, 1);

            // Insert the goal at the new position
            currentGoals.splice(position, 0, goalToReorder);

            updateGoals(currentGoals);
            return [...currentGoals]; 
        });
    };

    const columnsDef = useMemo<Array<ColDef<IPersonalGoal>>>(() => [
        {
            headerName: 'Priority',
            valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
            maxWidth: 75,
            width: 75,
            minWidth: 75,
            rowDrag: true
        },
        {
            headerName: 'Character',
            cellRenderer: (props: ICellRendererParams<IPersonalGoal>) => {
                const personalGoal = props.data;
                if(!personalGoal) {
                    return undefined;
                }
                
                return <TextWithTooltip text={personalGoal.character}/>;
            }
        },
        {
            headerName: 'Goal Type',
            cellRenderer: (props: ICellRendererParams<IPersonalGoal>) => {
                const personalGoal = props.data;
                if(!personalGoal) {
                    return undefined;
                }
                if (personalGoal.type === PersonalGoalType.UpgradeRank) {
                    return <TextWithTooltip text={'Upgrade Rank'}/>;
                }

                if (personalGoal.type === PersonalGoalType.Ascend) {
                    return <TextWithTooltip text={'Ascend'}/>;
                }

                return undefined;
            }
        },
        {
            headerName: 'Current',
            cellRenderer: (props: ICellRendererParams<IPersonalGoal>) => {
                const personalGoal = props.data;
                if(!personalGoal) {
                    return undefined;
                }
                const character = characters.find(x => x.name === personalGoal.character);
                if (personalGoal.type === PersonalGoalType.UpgradeRank) {
                    return <RankImage rank={character?.rank ?? 0}/>;
                }

                if (personalGoal.type === PersonalGoalType.Ascend) {
                    return <RarityImage rarity={character?.rarity ?? 0}/>;
                }
                
                return undefined;
            }
        },
        {
            headerName: 'Goal',
            cellRenderer: (props: ICellRendererParams<IPersonalGoal>) => {
                const personalGoal = props.data;
                if(!personalGoal) {
                    return undefined;
                }
                
                if (personalGoal.type === PersonalGoalType.UpgradeRank) {
                    return <RankImage rank={personalGoal.targetRank ?? 0}/>;
                }

                if (personalGoal.type === PersonalGoalType.Ascend) {
                    return <RarityImage rarity={personalGoal?.targetRarity ?? 0}/>;
                }

                return undefined;
            }
        },
        {
            headerName: 'Notes',
            cellRenderer: (props: ICellRendererParams<IPersonalGoal>) => {
                const personalGoal = props.data;
                if(!personalGoal || !personalGoal.notes) {
                    return undefined;
                }

                return <TextWithTooltip text={personalGoal.notes}/>;
            }
        },
        {
            maxWidth: 75,
            width: 75,
            minWidth: 75,
            cellRenderer: GoalOptionsCell,
            cellRendererParams: {
                removeGoal
            }
        },
    ], []);

    const rows = useMemo<Array<IPersonalGoalRow>>(() => {
        return goals.map(personalGoal => {
            const character = characters.find(x => x.name === personalGoal.character);
            let goalType = '';
            let current = '';
            let goal = '';

            if (personalGoal.type === PersonalGoalType.UpgradeRank) {
                goalType = 'Upgrade Rank';
                current = Rank[character?.rank ?? 0];
                goal = Rank[personalGoal.targetRank ?? 0];
            }

            if (personalGoal.type === PersonalGoalType.Ascend) {
                goalType = 'Ascend';
                current = Rarity[character?.rarity ?? 0];
                goal = Rarity[personalGoal.targetRarity ?? 0];
            }

            return {
                goalId: personalGoal.id,
                character: personalGoal.character,
                goalType,
                current,
                goal,
                notes: personalGoal.notes
            };
        });
    }, [goals]);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tooltip content="You can have only 20 goals at the same time" relationship={'description'} visible={disableNewGoals}>
                    <span>
                        <Button variant={'outlined'} disabled={disableNewGoals} onClick={() => setShowSetGoals(true)}>Set Goal</Button>
                    </span>
                </Tooltip>
                { isMobile ? (<span>Use horizontal view</span>): undefined }
            </div>

            <SetGoalDialog key={goals.length} isOpen={showSetGoals} onClose={(goal) => {
                setShowSetGoals(false);
                addGoal(goal);
            }}/>
            <Box>
                <div className="ag-theme-material" style={{ height: 'calc(100vh - 150px)', width: '100%' }}>
                    <AgGridReact<IPersonalGoal>
                        ref={gridRef}
                        rowData={goals}
                        suppressCellFocus={true}
                        columnDefs={columnsDef}
                        animateRows={true}
                        rowDragManaged={true}
                        enableBrowserTooltips={true}
                        onGridReady={fitGridOnWindowResize(gridRef)}
                        onRowDragEnd={(event) => {
                            gridRef.current?.api?.refreshCells();
                            reorderGoal(event.node.data?.id ?? '', event.overIndex);
                        }}
                    >
                    </AgGridReact>
                </div>
            </Box>
        </div>
    );
};

