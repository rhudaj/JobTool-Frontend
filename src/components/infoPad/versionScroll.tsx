import { useEffect, useState } from "react";
import { useImmer } from "use-immer"
import { VersionedItem } from "./infoPad";

export default function VersionedItemUI(props: {
    obj: VersionedItem,
}) {

    const [versions, setVersions] = useImmer([]);
    const [cur, setCur] = useState(0);

    useEffect(()=>{
        setVersions(props.obj.versions);
    }, [props.obj.versions])

    return (
        <div>
            <p>{props.obj.id}</p>
        </div>
    )
};