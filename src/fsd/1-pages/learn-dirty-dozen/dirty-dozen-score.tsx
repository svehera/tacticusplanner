export const Score = ({ value }: { value: number }) => {
    let backgroundColor: string;
    if (value <= 5 && value > 4.5) {
        backgroundColor = '#01BE64';
    } else if (value >= 4.0) {
        backgroundColor = '#7ED857';
    } else if (value >= 3.5) {
        backgroundColor = '#CBFC80';
    } else if (value >= 3.0) {
        backgroundColor = '#F1D153';
    } else if (value >= 2.5) {
        backgroundColor = '#FFBD59';
    } else if (value >= 2.0) {
        backgroundColor = '#FE904E';
    } else if (value >= 1.5) {
        backgroundColor = '#F05152';
    } else if (value >= 0.5) {
        backgroundColor = '#F22E30';
    } else {
        backgroundColor = '#A6A5A6';
    }

    return (
        <div className="w-full flex justify-center">
            <div
                className="h-8 aspect-square rounded-full text-center font-bold border text-[#181d1f]"
                style={{ backgroundColor }}>
                {value}
            </div>
        </div>
    );
};
