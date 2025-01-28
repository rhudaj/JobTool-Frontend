import "./popupmodal.sass"
import useToggle from "../../hooks/toggle";
import { joinClassNames } from "../../util/joinClassNames";
import { forwardRef, useImperativeHandle } from "react";

interface PopupModalHandle {
    open: () => void;
    close: () => void;
}

const PopupModal = forwardRef<PopupModalHandle, { children?: React.ReactNode }>(({ children }, ref) => {

    const [isOpen, setIsOpen] = useToggle();

    useImperativeHandle(ref, () => ({
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
    }));

    return (
        <>
            <dialog open={isOpen} id="modal" className={joinClassNames('modal', isOpen?'open':'')}>
                <div className="modal-content">{children}</div>
                <div className="modal-controls">
                    <span className="modal-close" onClick={setIsOpen}>X</span>
                </div>
            </dialog>
        </>
    )
});

export { PopupModal, PopupModalHandle }