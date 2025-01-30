import './versionScroll.sass'
import { useEffect, useMemo, useState } from "react";
import { VersionedItem } from "./infoPad";
import { BucketTypes, Item } from "../dnd/types";

export default function VersionedItemUI(props: {
    obj: VersionedItem,
    onUpdate?: (newObj: VersionedItem<any>) => void;
}) {

    const [versions, setVersions] = useState<Item<any>[]>(null);
    const [cur, setCur] = useState(0);

    const displayItem = useMemo(()=>
        BucketTypes[props.obj.item_type].DisplayItem
    , [props.obj.item_type]);

    useEffect(()=> setVersions(props.obj.versions), [props.obj.versions]);

    const handleNewVersion = () => {
        setCur(prev => (prev === versions.length-1) ? 0 : prev+1)
    };

    if (!versions) return null;

    const version_str = `${props.obj?.id}/${versions[cur]?.id}`;

    return (
        <div className="versioned-item-container">

            <span className="switch-version-button" onDoubleClick={handleNewVersion} title={version_str}>S</span>
            {displayItem({obj: versions[cur].value})}
        </div>
    )
};