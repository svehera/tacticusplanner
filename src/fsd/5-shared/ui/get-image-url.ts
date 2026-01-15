/**
 * @deprecated Vite handles asset URLs automatically when they are imported; use direct imports instead.
 *      Doing these dynamic URLs stops Vite from being able to process them and they end up excluded.
 */
export function getImageUrl(image: string): string {
    return new URL(`../../../assets/images/${image}`, import.meta.url).href;
}
