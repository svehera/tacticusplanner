export function getImageUrl(image: string): string {
    return new URL(`../../../assets/images/${image}`, import.meta.url).href;
}
