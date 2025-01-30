import './versionedItem.sass'
import { useEffect, useMemo, useState } from "react";
import { BucketType, BucketTypes, InfoPadMap, Item } from "../dnd/types";
import { StandaloneDragItem } from '../dnd/BucketItem';

export interface VersionedItem<T=any> {
    id: string,
    item_type: string,
    versions: Item<T>[],
};

/**
 * You can flip through versions, but
 * only the current version is draggable!
 * The current value itself is not dragged,
 * only the ID of the current value. It's
 * up to the dropped component to extract the value
 * corresponding to that ID.
 */
export function VersionedItemUI(props: {
    obj: VersionedItem,
    onUpdate?: (newObj: VersionedItem<any>) => void;
}) {

    // ----------------- STATE -----------------

    const [versions, setVersions] = useState<Item<any>[]>(null);
    const [cur, setCur] = useState(0);

    useEffect(()=> setVersions(props.obj.versions), [props.obj.versions]);

    // Get the display item function
    const displayItem = useMemo(()=> BucketTypes[props.obj.item_type].DisplayItem, [props.obj.item_type]);

    // ----------------- CONTROLS -----------------

    const switchVersion = () => {
        setCur(prev => (prev === versions.length-1) ? 0 : prev+1)
    };

    const newVersion = () => {
        // create a copy of the current version.
        const copy = {...versions[cur]};
        copy.id += "_copy";
        versions.splice(0, 0, copy);
        setCur(0);
    };

    // ----------------- RENDER -----------------

    if (!versions) return null;

    const version_str = `${props.obj?.id}/${versions[cur]?.id}`;
    const bt: BucketType = BucketTypes[props.obj.item_type];
    const dnd_item: Item<string> = {id: version_str, value: version_str};

    return (
        <div className="versioned-item-container">
            <div className='version-controls'>
                <span className="control-button" id="switch" onDoubleClick={switchVersion} title={version_str}>S</span>
                <span className="control-button" id="new" onDoubleClick={newVersion} title={version_str}>E</span>
            </div>
            <StandaloneDragItem item={dnd_item} item_type={bt.item_type} >
                {displayItem({obj: versions[cur].value})}
            </StandaloneDragItem>
        </div>
    )
};
