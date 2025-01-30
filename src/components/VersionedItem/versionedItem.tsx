import './versionedItem.sass'
import { useEffect, useMemo, useRef, useState } from "react";
import { BucketType, BucketTypes, DynamicComponent, InfoPadMap, Item } from "../dnd/types";
import { StandaloneDragItem } from '../dnd/BucketItem';
import { PopupModal } from '../PopupModal/PopupModal';
import TextEditDiv from '../TextEditDiv/texteditdiv';
import useToggle from '../../hooks/toggle';
import { usePopup } from '../../hooks/Popup/popup';

export interface VersionedItem<T=any> {
    id: string,
    item_type: string,
    versions: Item<T>[],
};


function EditItem(props: {
    startingItem: Item<any>;
    item_type: string;
}) {

    const [id, setId] = useState(null);
    const [value, setValue] = useState(null);

    useEffect(()=>setId(props.startingItem.id), [props.startingItem.id]);
    useEffect(()=>setValue(props.startingItem.value), [props.startingItem.value]);

    return (
        <div className='item-edit'>
            <div className='name-edit'>
                <p>Name:</p>
                <TextEditDiv tv={id} onUpdate={setId}/>
            </div>
            <div className='content-edit'>
                <DynamicComponent type={props.item_type} props={{
                    obj: value,
                    onUpdate: (newVal: any) => {
                        console.log('Changes have been made');
                        setValue(newVal);
                    }
                }}/>
            </div>
        </div>
    );
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
    const displayItem = useMemo(()=> BucketTypes[props.obj.item_type].DisplayItem, [props.obj.item_type]);
    const editPopup = usePopup();

    // ----------------- CONTROLS -----------------

    const switchVersion = () => {
        setCur(prev => (prev === versions.length-1) ? 0 : prev+1)
    };

    const openEditPopup = () => {
        // create a copy of the current version.
        const copy = {...versions[cur]};
        copy.id += "_copy";
        // Open the popup
        editPopup.open(
            <EditItem startingItem={copy} item_type={props.obj.item_type}/>
        )
    };

    // ----------------- RENDER -----------------

    if (!versions) return null;

    const version_str = `${props.obj?.id}/${versions[cur]?.id}`;
    const bt: BucketType = BucketTypes[props.obj.item_type]; // todo: use DynamicComponent instead
    const dnd_item: Item<string> = {id: version_str, value: version_str};

    return (
        <div className="versioned-item-container">
            {editPopup.PopupComponent}
            <div className='version-controls'>
                <span className="control-button" id="switch" onDoubleClick={switchVersion} title={version_str}>S</span>
                <span className="control-button" id="new" onDoubleClick={openEditPopup} title={version_str}>E</span>
            </div>
            <StandaloneDragItem item={dnd_item} item_type={bt.item_type} >
                {displayItem({obj: versions[cur].value})}
            </StandaloneDragItem>
        </div>
    )
};
