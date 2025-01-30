import './versionScroll.sass'
import { useEffect, useMemo, useState } from "react";
import { BucketType, BucketTypes, InfoPadMap, Item } from "../dnd/types";
import { StandaloneDragItem } from '../dnd/BucketItem';

export interface VersionedItem<T=any> {
    id: string,
    item_type: string,
    versions: Item<T>[],
}

/**
 * You can flip through versions, but
 * only the current version is draggable!
 * The current value itself is not dragged,
 * only the ID of the current value. It's
 * up to the dropped component to extract the value
 * corresponding to that ID.
 */
export default function VersionedItemUI(props: {
    obj: VersionedItem,
    onUpdate?: (newObj: VersionedItem<any>) => void;
}) {

    const [versions, setVersions] = useState<Item<any>[]>(null);
    const [cur, setCur] = useState(0);

    // Get the display item type
    const displayItem = useMemo(()=>
        BucketTypes[props.obj.item_type].DisplayItem
    , [props.obj.item_type]);

    useEffect(()=> setVersions(props.obj.versions), [props.obj.versions]);

    const handleNewVersion = () => {
        setCur(prev => (prev === versions.length-1) ? 0 : prev+1)
    };

    if (!versions) return null;

    const version_str = `${props.obj?.id}/${versions[cur]?.id}`;
    const bt: BucketType = BucketTypes[props.obj.item_type];
    const dnd_item: Item<string> = {id: version_str, value: version_str};

    return (
        <div className="versioned-item-container">
            <span className="switch-version-button" onDoubleClick={handleNewVersion} title={version_str}>S</span>
            <StandaloneDragItem item={dnd_item} item_type={bt.item_type} >
                {displayItem({obj: versions[cur].value})}
            </StandaloneDragItem>
        </div>
    )
};
