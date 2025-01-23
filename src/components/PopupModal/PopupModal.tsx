import "./popupmodal.sass"
import useToggle from "../../hooks/toggle";
import { joinClassNames } from "../../util/joinClassNames";

export default function PopupModal(props: {
    label: string,
    children?: React.ReactNode
}) {
    const [isOpen, setIsOpen] = useToggle();
    return (
        <>
            <button onClick={setIsOpen}>{props.label}</button>
            <dialog open={isOpen} id="modal" className={joinClassNames('modal', isOpen?'open':'')}>
                <div className="modal-content">{props.children}</div>
                <div className="modal-controls">
                    <span className="modal-close" onClick={setIsOpen}>X</span>
                </div>
            </dialog>
        </>
    )
}