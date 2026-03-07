/* Find and remove the first occurrence of an item from an array.
 * IMPORTANT: This function modifies the input array directly.
 * @param arr - The array to modify (will be changed by this function)
 * @param x - The item to find and remove
 * @return true if the item was found and removed, false otherwise
 */
export const findAndRemoveItem = <T>(array: T[], x: T) => {
    const itemIndex = array.indexOf(x);
    if (itemIndex === -1) {
        return false;
    }
    array.splice(itemIndex, 1);
    return true;
};
