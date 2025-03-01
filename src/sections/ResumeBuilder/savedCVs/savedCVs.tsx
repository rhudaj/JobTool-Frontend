import './savedCVs.sass'
import { useShallow } from "zustand/react/shallow";
import { useCvsStore } from "../useCVs";
import { joinClassNames } from "../../../util/joinClassNames";
import { useMemo } from "react";

const DEFAULT_GROUP = "other"


/**
 * Displays the list of saved CVs.
 * And allows the user to select one (change state.curIdx)
 */
// TODO: only works for 1 level of nesting
export default function SavedCVsUI() {

    const cvsState = useCvsStore();
    // useShallow => cvNames updates ONLY when output of the selector does
    const cvNames = useCvsStore(useShallow(state => state.ncvs.map(cv => cv.name || "Unnamed CV")));
    const cvPaths = useCvsStore(useShallow(state => state.ncvs.map(cv => cv.path)));

    const groups = useMemo(()=>{
        // path looks like: "/dir1/dir2/.../dirN/name"
        // this should insert the item {name, i} into groups[dir1][di2]...[dirN]
        const groups = {};
        cvNames.forEach((name, cv_idx) => {
            const path = cvPaths[cv_idx];
            if (path === "/") {
                groups[DEFAULT_GROUP] = groups[DEFAULT_GROUP] || [];
                groups[DEFAULT_GROUP].push({name, cv_idx});
                return;
            }
            const [subGroups, lastPart] = [path.split("/").slice(1, -1), path.split("/").pop()];
            let cur = groups; // start at root
            subGroups.forEach(part => {
                cur[part] = cur[part] || {}; // may(not) exist yet
                cur = cur[part];
            });
            // last part, insert the item
            cur[lastPart] = cur[lastPart] || [];
            cur[lastPart].push({name, cv_idx});
        });
        return groups;
    }, [cvPaths])

    console.log("groups", groups);

    const curName = cvNames ? cvNames[cvsState.curIdx] : "";

    const onThumbnailClick = (idx: number) => {
        console.log("thumbnail click", idx);
        if (idx === cvsState.curIdx) return; // only update if diff
        cvsState.setCur(idx);
    }

    return (
        <div className="cv-groups-container">
            {Object.entries(groups).map(([group, list]: [string, any[]]) => (
                <div key={group} className="cv-group">
                    <h4>{group}</h4>
                    <div className="group-list">
                        {list.map(({name, cv_idx}) => (
                            <div key={name}
                                className={joinClassNames(
                                    "cv-thumbnail",
                                    name === curName ? "active" : "",
                                    cvsState.trackMods[cv_idx] ? "is-modified" : ""
                                )}
                                onClick={()=>onThumbnailClick(cv_idx)}
                            >
                                {name}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
