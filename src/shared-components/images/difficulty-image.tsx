import { Difficulty } from 'src/models/enums';

import difficultyHardImg from '@/fsd/5-shared/assets/images/icons/difficulty-hard.png';
import difficultyNormalImg from '@/fsd/5-shared/assets/images/icons/difficulty-normal.png';
import difficultyVeryImg from '@/fsd/5-shared/assets/images/icons/difficulty-very-hard.png';
import difficultyImg from '@/fsd/5-shared/assets/images/icons/difficulty.png';

export const DifficultyImage = ({ difficulty, withColor = false }: { difficulty: Difficulty; withColor?: boolean }) => {
    if (withColor) {
        switch (difficulty) {
            case Difficulty.Easy:
                return <img className="pointer-events-none" src={difficultyImg} height={15} alt="Difficulty Easy" />;

            case Difficulty.Normal:
                return (
                    <img
                        className="pointer-events-none"
                        src={difficultyNormalImg}
                        height={15}
                        alt="Difficulty Normal"
                    />
                );
            case Difficulty.Hard:
                return (
                    <img className="pointer-events-none" src={difficultyHardImg} height={15} alt="Difficulty Hard" />
                );
            case Difficulty.VeryHard:
                return (
                    <img
                        className="pointer-events-none"
                        src={difficultyVeryImg}
                        height={15}
                        alt="Difficulty Very Hard"
                    />
                );
        }
    }

    const difficultyImages = Array.from({ length: difficulty }, (_, index) => (
        <img key={index} className="pointer-events-none" src={difficultyImg} height={15} alt="Difficulty" />
    ));

    return <div className="flex">{difficultyImages}</div>;
};
