import React from 'react';

import difficultyHardImg from 'src/assets/images/icons/difficulty-hard.png';
import difficultyNormalImg from 'src/assets/images/icons/difficulty-normal.png';
import difficultyVeryImg from 'src/assets/images/icons/difficulty-very-hard.png';
import difficultyImg from 'src/assets/images/icons/difficulty.png';
import { Difficulty } from 'src/models/enums';

export const DifficultyImage = ({ difficulty, withColor = false }: { difficulty: Difficulty; withColor?: boolean }) => {
    if (withColor) {
        switch (difficulty) {
            case Difficulty.Easy:
                return <img style={{ pointerEvents: 'none' }} src={difficultyImg} height={15} alt="Difficulty Easy" />;

            case Difficulty.Normal:
                return (
                    <img
                        style={{ pointerEvents: 'none' }}
                        src={difficultyNormalImg}
                        height={15}
                        alt="Difficulty Normal"
                    />
                );
            case Difficulty.Hard:
                return (
                    <img style={{ pointerEvents: 'none' }} src={difficultyHardImg} height={15} alt="Difficulty Hard" />
                );
            case Difficulty.VeryHard:
                return (
                    <img
                        style={{ pointerEvents: 'none' }}
                        src={difficultyVeryImg}
                        height={15}
                        alt="Difficulty Very Hard"
                    />
                );
        }
    }

    const difficultyImages = Array.from({ length: difficulty }, (_, index) => (
        <img key={index} style={{ pointerEvents: 'none' }} src={difficultyImg} height={15} alt="Difficulty" />
    ));

    return <div style={{ display: 'flex' }}>{difficultyImages}</div>;
};
