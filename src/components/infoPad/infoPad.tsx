import './infoPad.sass';
import React, { forwardRef, useImperativeHandle } from "react";
import { InfoPadMap } from '../dnd/types';
import { Item, Bucket } from '../dnd/types';
import { VersionedItemUI, VersionedItem } from "../VersionedItem/versionedItem"
import { useImmer } from 'use-immer';

export interface CVInfo {
    [ secName: string ]: {                  // section name
        [ groupName: string ]: {         // e.g. experience/project id
            [ itemName: string ]: any;   // e.g. id: experience content
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



export interface InfoPadHandle {
	get: () => CVInfo;
}

// MAIN COMPONENT
const InfoPad = forwardRef<InfoPadHandle, { info: CVInfo }>(({ info }, ref) => {

    // ----------------- STATE -----------------

    const [cvInfo, setCVInfo] = useImmer<CVInfo>(null);
    const [sections, setSections] = useImmer(null);

    React.useEffect(() => {
        if (!info) return;
        setCVInfo(info);
        setSections(Info2Sections(info));
    }, [info]);

    // give parent access to CV
    useImperativeHandle(ref, () => ({
        get: () => { return Sections2Info(sections)  }
    }));

    // ----------------- VIEW -----------------

    if (!cvInfo || !sections) return <div id="info-pad">no CV info found</div>;

    return (
        <div id="info-pad">
            {sections.map((sec, sec_idx: number) => (
                <div className="info-pad-section" key={sec_idx}>
                    <h2>{sec.secName.toUpperCase()}</h2>
                    <div className='section-items'>
                        {sec.items.map((I: VersionedItem, item_idx) =>
                            <VersionedItemUI
                                key={item_idx}
                                obj={I}
                                onUpdate={((newVI: VersionedItem) => {
                                    setSections(cur=>{
                                        cur[sec_idx].items[item_idx] = newVI;
                                    })
                                })}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
});

export default InfoPad;