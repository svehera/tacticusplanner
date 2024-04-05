import React from 'react';
import { Difficulty } from 'src/models/enums';
import difficultyImg from 'src/assets/images/icons/difficulty.png';

export const DifficultyImage = ({ difficulty }: { difficulty: Difficulty }) => {
    const difficultyImages = Array.from({ length: difficulty }, (_, index) => (
        <img key={index} style={{ pointerEvents: 'none' }} src={difficultyImg} height={15} alt="Difficulty" />
    ));

    return <div style={{ display: 'flex' }}>{difficultyImages}</div>;
};
