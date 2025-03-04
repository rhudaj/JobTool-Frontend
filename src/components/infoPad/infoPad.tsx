import './infoPad.sass';
import React, { useCallback } from "react";
import { InfoPadMap } from '../dnd/types';
import { Item } from '../dnd/types';
import { VersionedItemUI, VersionedItem } from "../VersionedItem/versionedItem"
import { useImmer } from 'use-immer';
import { isEqual } from 'lodash';

// TODO: atm InfoPad does not work because it does not supply CVContext

export interface CVInfo {
    [ secName: string ]: {                  // section name
        [ groupName: string ]: {            // e.g. experience/project id
            [ itemName: string ]: any;      // e.g. id: experience content
        }
    }
}

const Info2Sections = (info: CVInfo): {secName: string, items: VersionedItem[]}[] => (
    Object.entries(info)
    .map( ([ secName, secGroups ]) => ({
        secName: secName,
        items: Object.entries(secGroups).map(([ groupName, groupItems ]) => ({
            id: groupName,
            item_type: InfoPadMap[secName],
            versions: Object.entries(groupItems).map(([id, value])=>({
                id: id,
                value: value
            } as Item))
        } as VersionedItem))
    }))
);

const Sections2Info = (sections: { secName: string; items: VersionedItem<any>[] }[]): CVInfo => {
    const info: CVInfo = {};

    sections.forEach(({ secName, items }) => {
        if (!info[secName]) {
            info[secName] = {};
        }

        items.forEach(versionedItem => {
            const groupName = versionedItem.id;

            if (!info[secName][groupName]) {
                info[secName][groupName] = {};
            }

            versionedItem.versions.forEach(version => {
                info[secName][groupName][version.id] = version.value;
            });
        });
    });

    return info;
};

// MAIN COMPONENT
export function InfoPad(props: { info: CVInfo, onUpdate: (newInfo: CVInfo)=>void }) {

    // ----------------- STATE -----------------

    const [state, setState] = useImmer({
        sections: [],
        status: false // only true if the user made changes
    });

    // Sync `sections` only when `info` changes, but don't overwrite user edits
    React.useEffect(() => {
        setState(D=>{
            D.sections = Info2Sections(props.info)
            D.status = false
        })
    }, [props.info])

    // Call `onUpdate` only when `sections` have been edited
    React.useEffect(() => {
        if (!state.status) return // not changed by user
        console.debug('InfoPad: sections updated');
        props.onUpdate( Sections2Info(state.sections) );
    }, [state.sections]);


    // ----------------- CONTROLS -----------------

    const onVersionedItemUpdate = (newVI: VersionedItem, sec_idx, item_idx) => {
        setState(D=>{
            D.sections[sec_idx].items[item_idx] = newVI
            D.status = true
        })
    }

    // ----------------- VIEW -----------------

    if (!state.sections) {
        return <div id="info-pad">no CV info found</div>;
    }
    return (
        <div id="info-pad">
            {state.sections.map((sec, sec_idx: number) => (
                <div key={sec_idx} className="info-pad-section">
                    <h2>{sec.secName.toUpperCase()}</h2>
                    <div className='section-items'>
                        {sec.items.map((vi: VersionedItem, i: number) =>
                            <VersionedItemUI
                                key={i}
                                obj={vi}
                                onUpdate={(newVI)=>onVersionedItemUpdate(newVI, sec_idx, i)}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
};
