import './versionedItem.sass'
import { useEffect, useMemo, useRef, useState } from "react";
import { BucketTypeNames, DynamicComponent, Item } from "../dnd/types";
import { StandaloneDragItem } from '../dnd/BucketItem';
import TextEditDiv from '../TextEditDiv/texteditdiv';
import { usePopup } from '../../hooks/Popup/popup';
import { useImmer } from 'use-immer';
import { isEqual } from 'lodash';
import { ControlsBox } from '../ControlsBox/ControlBox';

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

const useVIState = () => {
    const [versions, setItems] = useImmer<Item<any>[]>([]);
    const [cur, setCur] = useState(0);
    return {
        // getters --------------------------------
        versions,
        cur,
        curVersion: useMemo(()=>versions[cur], [cur, versions]),
        status: useMemo(()=>versions.length > 0, [versions]),
        getCopyCur: (): Item => {
            return {...versions[cur]};
        },
        // setters --------------------------------
        init: (items: Item[]) => {
            console.log("Initializing versions to: ", items);
            if(!items) {
                console.debug("CAUGHT !items")
                return
            }
            if(isEqual(versions, items)) {
                console.debug("CAUGHT isEqual")
                return
            }
            setItems(items);
            setCur(0);
        },
        addNew: (newItem: Item) => {
            setItems(D => {
                D.push(newItem);
            });
            setCur(prev => prev + 1);
            console.log("Added a new item version!");
        },
        editCur: (newItem: Item) => {
            setItems(D => {
                D[cur] = newItem;
            });
            console.log("Edited the current item version!");
        },
        delCur: () => {
            console.log(`Deleting cur item (${versions[cur].id})`);
            setItems(D => {
                D.splice(cur, 1);
            });
            setCur(0);
            console.log("Deleted the current item version!");
        },
        switchVersion: () => {
            setCur(prev => (prev === versions.length - 1 ? 0 : prev + 1));
        }
    };
}

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

    const state = useVIState();

    useEffect(()=> {
        state.init(props.obj.versions);
    }, [props.obj.versions]);

    // Alert parent when state changes
    useEffect(()=>{
        if(!state.status) {
            console.debug("CAUGHT !state.versions")
            return;
        }
        if(isEqual(state.versions, props.obj.versions)) {
            console.debug("CAUGHT isEqual")
            return
        }
        console.debug("UPDATE", state.versions)
        props.onUpdate({
            ...props.obj,
            versions: state.versions
        })
    }, [state.versions])

    const editNewItemPopup = usePopup();

    // ----------------- CONTROLS -----------------

    const openEditNewItemPopup = () => {
        const copy = state.getCopyCur();
        copy.id += "_copy";
        editNewItemPopup.open(
            <EditNewItem
                startingItem={copy}
                item_type={props.obj.item_type}
                onSave={(newItem: Item) => {
                    state.addNew(newItem)
                    editNewItemPopup.close()
                }}
            />
        )
    };

    const openEditExistingPopup = () => {
        editNewItemPopup.open(
            <EditExistingItem
                item={state.curVersion}
                item_type={props.obj.item_type}
                onSaveChanges={(modifiedItem: Item) => {
                    state.editCur(modifiedItem);
                    editNewItemPopup.close();
                }}
                onDeleteItem={() => {
                    state.delCur();
                    editNewItemPopup.close();
                }}
            />
        )
    };

    // ----------------- RENDER -----------------

    if (!state.versions) return <div>No versions</div>;

    const _cur = state.curVersion

    if (!_cur) return <div>No current version</div>;

    const version_str = `${props.obj?.id}/${state.curVersion?.id}`

    const dnd_item: Item<string> = {
        id: version_str,
        value: state.curVersion?.value
    }

    return (
        <div className="versioned-item-container">
            {editNewItemPopup.PopupComponent}
            {/* CONTROLS ARE FLOATING TO THE LEFT (NOT IN THE LAYOUT) */}
            <ControlsBox
                id="version-controls"
                isVertical={true}
                controls={[
                    { id: "edit", icon_class: "fa-solid fa-pen", onClick: openEditExistingPopup },
                    { id:"switch", icon_class: "fa-solid fa-right-left", onClick: state.switchVersion },
                    { id: "new", icon_class: "fa-solid fa-plus", onClick: openEditNewItemPopup }
                ]}
            />
            {/* this text is also floating */}
            <div className='version-id-container'>
                <p>{version_str}</p>
            </div>
            <StandaloneDragItem item={dnd_item} item_type={props.obj.item_type} >
                <DynamicComponent
                    key={state.cur} // force re-render when cur changes
                    type={props.obj.item_type}
                    props={{
                        obj: state.curVersion?.value,
                        disableBucketFeatures: true     // applies to any item with a Bucket component
                    }}
                />
            </StandaloneDragItem>
        </div>
    )
}
