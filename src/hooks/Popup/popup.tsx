import './popup.sass'
import { useState, useEffect, ReactNode, useRef } from "react";
import { createPortal } from "react-dom";

interface PopupProps {
    onClose: () => void;
    children: ReactNode;
}

const PopupUI = ({ onClose, children }: PopupProps) => {
    return createPortal(
        <div className="popup-overlay">
            <div className="popup-div">
                <button className="popup-close" onClick={onClose}>✖</button>
                <div className="popup-content">{children}</div>
            </div>
        </div>,
        document.body
    );
};

export const usePopup = (content?: ReactNode) => {
    const [popup, setPopup] = useState<ReactNode>(null);
    const contentRef = useRef(content);

    const open = (content?: ReactNode|any) => {
        // If they passed a valid react component, use that instead
        if(content && !content.$$typeof) {
            content = contentRef.current
        }
        console.log("opening popup...")
        setPopup(
            <PopupUI onClose={close}>{content}</PopupUI>
        );
    };

    const close = () => {
        console.log("closing popup...")
        setPopup(null);
    };

    return { open, close, PopupComponent: popup };
};
