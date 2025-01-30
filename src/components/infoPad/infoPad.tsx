import './infoPad.scss';
import  useLogger  from '../../hooks/logger';
import ItemBucket from '../dnd/Bucket';
import React from "react";
import { BucketTypes, InfoPadMap } from '../dnd/types';
import { Item, Bucket } from '../dnd/types';

export interface CVInfo {
    [ secName: string ]: {                  // section name
        [ groupName: string ]: {         // e.g. experience/project id
            [ itemName: string ]: any;   // e.g. id: experience content
        }
    }
}

export interface VersionedItem<T=any> {
    id: string,
    item_type: string,
    versions: Item<T>[],
}

const Info2Buckets = (info: CVInfo): Bucket<VersionedItem<any>>[] => {
    const sections = Object.entries(info);
    const buckets = [];
    sections.forEach(([secName, secGroups])=>{
        const bucket = { id: secName, items: []};
        const named_groups = Object.entries(secGroups);
        named_groups.forEach(([groupName, groupItems])=>{
            const items = Object.entries(groupItems);
            const versioned_item: VersionedItem<any> = {
                id: groupName,
                item_type: InfoPadMap[secName],
                versions: items.map(([id, value])=>({
                    id: id,
                    value: value
                } as Item))
            };
            // since buckets need to hold items:
            bucket.items.push({
                id: groupName,
                value: versioned_item
            } as Item);
        })
        buckets.push(bucket);
    })
    return buckets;
};

function InfoPad(props: { info: CVInfo } ) {

    const log = useLogger("InfoPad");

    // ----------------- STATE -----------------

    const [infoBuckets, setInfoBuckets] = React.useState<Bucket<VersionedItem>[]>([]);

    // Convert into [{id: string, values: any[]}]
    React.useEffect(() => {
        if (!props.info) return;
        setInfoBuckets(
            Info2Buckets(props.info)
        )
    }, [props.info]);


    // ----------------- RENDER -----------------

    if (infoBuckets.length === 0) {
        log("No cv_info passed in props");
        return <div id="info-pad">no cv-info found</div>;
    }

    console.log("infoBuckets: ", infoBuckets);

    const InfoPadComponents = infoBuckets.map((bucket: Bucket<VersionedItem<any>>, i: number) => {
        return (
            <div className="info-pad-sec" key={i}>
                <h2>{bucket.id.toUpperCase()}</h2>
                <ItemBucket
                    key={i}
                    bucket={bucket}
                    type={"versioned_items"}
                    deleteDisabled replaceDisabled dropDisabled deleteOnMoveDisabled addItemDisabled
                />
            </div>
        );
    });

    // ----------------- RENDER -----------------

    if(infoBuckets.length === 0)
        return <div id="info-pad">no cv-info found</div>;
    else
        return <div id="info-pad">{InfoPadComponents}</div>;
};

export default InfoPad;