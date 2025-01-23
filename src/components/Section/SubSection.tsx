import "./SubSection.scss"

function SubSection(props: {
    id?: string;
    heading?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="sub-section">
            <h3 className="sub-sec-head">{props.heading}</h3>
            <div id={props.id} className="content">{props.children}</div>
        </div>
    );
};

export default SubSection;