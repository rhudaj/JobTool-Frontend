import "./section.sass";

export function Section(props: {
    id: string;
    heading: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`AppSection`} id={props.id}>
            <h1 className="app-sec-head">{props.heading}</h1>
            <div className="section-content loading-div">
                { props.children }
            </div>
        </div>
    );
}