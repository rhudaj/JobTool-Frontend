import './versionedItem.sass'
import { useEffect, useMemo, useState } from "react";
import { BucketType, BucketTypes, DynamicComponent, Item } from "../dnd/types";
import { StandaloneDragItem } from '../dnd/BucketItem';
import TextEditDiv from '../TextEditDiv/texteditdiv';
import { usePopup } from '../../hooks/Popup/popup';
import { useImmer } from 'use-immer';
import { isEqual } from 'lodash';
import "@fortawesome/fontawesome-free/css/all.min.css";     // icons

export interface VersionedItem<T=any> {
    id: string,
    item_type: string,
    versions: Item<T>[],
};

// HELPER/SUB COMPONENTS

function EditNewItem(props: {
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

function EditExistingItem(props: {
    item: Item;
    item_type: string;
    onSaveChanges: (modItem: Item<any>) => void;
    onDeleteItem: () => void;
}) {

    const [item, setItem] = useImmer<Item>(null);
    const [changesMade, setChangesMade] = useState(false);

    // parent --> this
    useEffect(()=>{
        setItem(props.item);
    }, [props.item]);

    // check if any changes made compared to the OG item
    useEffect(()=>{
        setChangesMade(
            !isEqual(item, props.item)
        );
    }, [item]);


    const onIDUpdate = (newId: string) => {
        setItem(draft=>{
            draft.id = newId;
        })
    };

    const onValueUpdate = (newVal: any) => {
        console.log('Changes have been made');
        setItem(draft=>{
            draft.value = newVal;
        })
    };

    if(!item) return;
    return (
        <div className='item-edit'>
            <div className='name-edit'>
                <h3>Name:</h3>
                <TextEditDiv tv={item.id} onUpdate={onIDUpdate}/>
            </div>
            <div className='content-edit'>
                <h3>Content:</h3>
                <DynamicComponent
                    type={props.item_type}
                    props={{
                        obj: item.value,
                        onUpdate: onValueUpdate
                    }}
                />
            </div>
            <div id='edit-controls'>
                {/* DISABLE THE SAVE BUTTON IF NO CHANGES MADE */}
                <button disabled={!changesMade} onClick={()=>props.onSaveChanges(item)}>Save</button>
                <button onClick={props.onDeleteItem}>Delete</button>
            </div>
        </div>
    );
};

// MAIN COMPONENT

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
    const editNewItemPopup = usePopup();
    // ensures the dynamic component re-renders when the version changes:

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
        editNewItemPopup.close();
        console.log("Added a new item version!");
    };

    const onSaveChanges = (modifiedItem: Item) => {
        // Assumes that the modifiedItem is at the `cur` index
        setVersions(draft=>{
            draft[cur] = modifiedItem;
        });
        editNewItemPopup.close();
    };

    const onDeleteCur = () => {
        console.log(`Deleting cur item (${versions[cur].id})`);
        setVersions(draft=>{
            draft.splice(cur, 1);
        })
        setCur(0);
        editNewItemPopup.close();
    };

    const openEditNewItemPopup = () => {
        // create a copy of the current version.
        const copy = {...versions[cur]};
        copy.id += "_copy";
        // Open the popup
        editNewItemPopup.open(
            <EditNewItem
                startingItem={copy}
                item_type={props.obj.item_type}
                onSave={onSaveNew}
            />
        )
    };

    const openEditExistingPopup = () => {
        editNewItemPopup.open(
            <EditExistingItem
                item={versions[cur]}
                item_type={props.obj.item_type}
                onSaveChanges={onSaveChanges}
                onDeleteItem={onDeleteCur}
            />
        )
    };

    // ----------------- RENDER -----------------

    if (!versions) return null;

    const version_str = `${props.obj?.id}/${versions[cur]?.id}`;
    const bt: BucketType = BucketTypes[props.obj.item_type]; // needed since ATM, drag-item names arent synced
    const dnd_item: Item<string> = {id: version_str, value: versions[cur]?.value};

    return (
        <div className="versioned-item-container">
            {editNewItemPopup.PopupComponent}
            {/* CONTROLS ARE FLOATING TO THE LEFT (NOT IN THE LAYOUT) */}
            <div className='version-controls'>
                <i id="switch"  className="control-button fa-solid fa-right-left" onDoubleClick={switchVersion} title="Switch" />
                <i id="edit"    className="control-button fa-solid fa-pen" onDoubleClick={openEditExistingPopup} title="Edit"/>
                <i id="new"     className="control-button fa-solid fa-plus" onDoubleClick={openEditNewItemPopup} title={"Copy as New"}/>
            </div>
            {/* this text is also floating */}
            <div className='version-id-container'><p>{version_str}</p></div>
            <StandaloneDragItem item={dnd_item} item_type={bt.item_type} >
                <DynamicComponent
                    key={cur} // force re-render when cur changes
                    type={props.obj.item_type}
                    props={{
                        obj: versions[cur]?.value,
                        disableBucketFeatures: true     // applies to any item with a Bucket component
                        // TODO: cutoff drag events instead?
                    }}
                />
            </StandaloneDragItem>
        </div>
    )
};
