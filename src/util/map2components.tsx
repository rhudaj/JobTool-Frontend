import { Fragment } from "react"
/**
 * Maps an array of items to React components with unique keys.
 *
 * @param items - The array of items to map.
 * @param renderFn - A function that takes an item and returns a ReactNode.
 * @param getKey - (Optional) Function to extract a unique key from each item.
 * @returns An array of React components with unique keys.
 */
export const mapToComponents = (
  items: any[],
  renderFn: (item: any) => React.ReactNode,
  getKey?: (item: any) => string | number
): React.ReactNode[] =>
  	items.map((item) =>
        <Fragment key={getKey(item)}>
            {renderFn(item)}
        </Fragment>
);
