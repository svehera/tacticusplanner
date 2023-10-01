import * as React from 'react';
import {
    MenuList,
    MenuItem,
    Menu,
    MenuPopover,
    MenuTrigger, 
} from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';

export const AppBarSubMenu = ({ setTitle }: {setTitle: (value: string) => void}) => {
    const navigate = useNavigate();
    return (
        <MenuList style={{ width: 70 }}>
            <Menu>
                <MenuTrigger disableButtonEnhancement>
                    <MenuItem style={{ background: '#1976d2', color: 'white', font: 'Roboto', fontWeight: 500, padding: 5 }}>TABLES</MenuItem>
                </MenuTrigger>
                <MenuPopover>
                    <MenuList >
                        <MenuItem onClick={() => {
                            navigate('./characters');
                            setTitle('Characters');
                        }}>Characters</MenuItem>
                        <MenuItem onClick={() => {
                            navigate('./dirtyDozen');
                            setTitle('Dirty Dozen');
                        }}>Dirty Dozen</MenuItem>
                    </MenuList>
                </MenuPopover>
            </Menu>
        </MenuList>
    );
};