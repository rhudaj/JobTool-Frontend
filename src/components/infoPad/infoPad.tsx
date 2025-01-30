import './infoPad.scss';
import  useLogger  from '../../hooks/logger';
import ItemBucket from '../dnd/ItemBucket';
import React from "react";
import { InfoPadMap } from '../dnd/types';
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
    versions: Item<T>[],
}

const Info2Buckets = (info: CVInfo): Bucket<VersionedItem<any>>[] => {
    const sections = Object.entries(info);
    const buckets = [];
    sections.forEach(([secName, secGroups])=>{
        const bucket = { id: secName, items: []};
        const named_groups = Object.entries(secGroups);
        named_groups.forEach(([groupName, groupItems])=>{
            const named_items = Object.entries(groupItems);
            const item_arr: Item[] = named_items.map(([itemName, content])=>({
                    id: `${groupName}/${itemName}`,
                    value: content
            }));
            const versioned_item: VersionedItem = {
                id: groupName,
                versions: item_arr
            };
            bucket.items.push(versioned_item);
        })
        buckets.push(bucket);
    })
    return buckets;
};

function InfoPad(props: { info: CVInfo } ) {

    const log = useLogger("InfoPad");

    // ----------------- STATE -----------------

    const [infoBuckets, setInfoBuckets] = React.useState<Bucket[]>([]);

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

    /** TODO: improve annoying dependency
     * As of now, when you add a new item to /public/cv_info.json or /public/cl_info.json
     * you also have to define a bucket type.
     * otherwise, BucketTypes[CVInfoPadMap[bucket.id]] will throw an error.
     */
    const InfoPadComponents = infoBuckets.map((bucket, i: number) => {
        return (
            <div className="info-pad-sec" key={i}>
                <h2>{bucket.id.toUpperCase()}</h2>
                <ItemBucket key={i} bucket={bucket} type={InfoPadMap[bucket.id]}
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