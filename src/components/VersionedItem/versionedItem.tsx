import './versionedItem.sass'
import { useEffect, useMemo, useState } from "react";
import { BucketType, BucketTypes, DynamicComponent, Item } from "../dnd/types";
import { StandaloneDragItem } from '../dnd/BucketItem';
import TextEditDiv from '../TextEditDiv/texteditdiv';
import { usePopup } from '../../hooks/Popup/popup';
import { useImmer } from 'use-immer';

export interface VersionedItem<T=any> {
    id: string,
    item_type: string,
    versions: Item<T>[],
};


function EditItem(props: {
    startingItem: Item<any>;
    item_type: string;
    onSave: (newItem: Item<any>) => void;
}) {

    const [id, setId] = useState(null);
    const [value, setValue] = useState(null);

    useEffect(()=>{
        setId(props.startingItem.id)
    }, [props.startingItem.id]);

    useEffect(() => {
        console.log('value = ', props.startingItem.value)
        setValue(props.startingItem.value)
    }, [props.startingItem.value]);

    if(!value) return;
    return (
        <div className='item-edit'>
            <div className='name-edit'>
                <h3>Name:</h3>
                <TextEditDiv tv={id} onUpdate={setId}/>
            </div>
            <div className='content-edit'>
                <h3>Content:</h3>
                <DynamicComponent
                    type={props.item_type}
                    props={{
                        obj: value,
                        onUpdate: (newVal: any) => {
                            console.log('Changes have been made');
                            setValue(newVal);
                        }
                    }}
                />
            </div>
            <button onClick={()=>props.onSave({id: id, value: value})}>Save</button>
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

    const [versions, setVersions] = useImmer<Item<any>[]>(null);
    const [cur, setCur] = useState(0);
    const editPopup = usePopup();
    // ensures the dynamic component re-renders when the version changes:
    const currentVersion = useMemo(() => versions ? versions[cur]?.value : null, [versions, cur]);


    useEffect(()=> {
        setVersions(props.obj.versions)
    }, [props.obj.versions]);

    // Alert parent when state changes
    useEffect(()=>{
        if(!versions) return;
        console.log("versions update: ", versions);
        props.onUpdate({
            ...props.obj,
            versions: versions
        })
    }, [versions])

    useEffect(() => {
        console.log(`Switched version to ${cur}`, versions?.[cur]);
    }, [cur, versions]);

    // ----------------- CONTROLS -----------------

    const switchVersion = () => {
        setCur(prev => (prev === versions.length - 1 ? 0 : prev + 1));
    };

    const onSaveNew = (newItem: Item) => {
        setVersions(draft => {
            draft.push(newItem);
        });
        setCur(prev => prev + 1); // Ensure cur updates in sync
        editPopup.close();
        console.log("Added a new item version!");
    };

    const openEditPopup = () => {
        // create a copy of the current version.
        const copy = {...versions[cur]};
        copy.id += "_copy";
        // Open the popup
        editPopup.open(
            <EditItem
                startingItem={copy}
                item_type={props.obj.item_type}
                onSave={onSaveNew}
            />
        )
    };

    // ----------------- RENDER -----------------

    if (!versions) return null;

    const version_str = `${props.obj?.id}/${versions[cur]?.id}`;
    const bt: BucketType = BucketTypes[props.obj.item_type]; // needed since ATM, drag-item names arent synced
    const dnd_item: Item<string> = {id: version_str, value: version_str};

    return (
        <div className="versioned-item-container">
            {editPopup.PopupComponent}
            <div className='version-controls'>
                <span className="control-button" id="switch" onDoubleClick={switchVersion} title={version_str}>S</span>
                <span className="control-button" id="new" onDoubleClick={openEditPopup} title={version_str}>E</span>
            </div>
            <StandaloneDragItem item={dnd_item} item_type={bt.item_type} >
                <DynamicComponent
                    type={props.obj.item_type}
                    props={{ obj: versions[cur]?.value }} // Directly use the value
                />
            </StandaloneDragItem>
        </div>
    )
};
