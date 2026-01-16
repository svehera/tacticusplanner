// eslint-disable-next-line import-x/no-internal-modules
import sampleAsset from 'src/assets/images/snowprint_assets/books/ui_icon_consumable_xp_book_0.png';
// ^ dual purpose:
// 1. This is used to determine how long of a prefix to strip from the paths that Vite provides.
// 2. It's a point-of-reference for the glob type used in this function.
//      If the snowprint sampleAsset path changes, it's a signal that the type on `root_glob` should be reviewed.

const prefixLength = sampleAsset.indexOf('snowprint_assets/');

/**
 *
 * @param importMetaGlob Return value from `import.meta.glob(path, { eager: true, import: default })
 * @returns A map of snowprint asset paths to their Vite-resolved URLs.
 *
 * The mined json has the asset paths starting from "snowprint_assets/..."
 * e.g. "Icon": "snowprint_assets/books/ui_icon_consumable_xp_book_0.png"
 * This doesn't exactly match our own paths since we have the full path from "src/assets/..."
 * e.g. "@/assets/snowprint_assets/books/ui_icon_consumable_xp_book_0.png"
 * This map allows us to resolve the image path given the snowprint asset path.
 * e.g.
 * {
 *   "snowprint_assets/books/ui_icon_consumable_xp_book_0.png" => "src/assets/snowprint_assets/books/ui_icon_consumable_xp_book_0.png"
 * }
 * We do this from `import.meta.glob`  instead of building the URL from string manipulation so that Vite bundles the images correctly.
 */
export function mapSnowprintAssets(importMetaGlob: Record<string, unknown>) {
    if (Object.values(importMetaGlob).length === 0) throw new Error(`No assets found in provided importMetaGlob`);
    return Object.fromEntries(
        Object.entries(importMetaGlob).map(([path, url]) => {
            if (typeof url !== 'string')
                throw new Error(`Expected imported asset to be a string URL, got: ${typeof url} for path: ${path}`);
            return [path.substring(prefixLength), url];
        })
    );
}
