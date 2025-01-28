import './infoPad.scss';
import  useLogger  from '../../hooks/logger';
import ItemBucket from '../dnd/ItemBucket';
import React from "react";
import { InfoPadMap } from '../dnd/types';

function InfoPad(props: { info: any} ) {

    const log = useLogger("InfoPad");

    // ----------------- STATE -----------------

    const [infoBuckets, setInfoBuckets] = React.useState([]);

    // Convert into [{id: string, values: any[]}]
    React.useEffect(() => {
        if (!props.info) return;
        setInfoBuckets(
            Object.entries(props.info).map(entry => ({
                id: entry[0],       // field name
                values: entry[1]    // value
            }))
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
                <ItemBucket key={i} id={bucket.id} type={InfoPadMap[bucket.id]} values={bucket.values}
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