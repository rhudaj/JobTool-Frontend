import './popup.sass'
import { useState, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface PopupProps {
    onClose: () => void;
    children: ReactNode;
}

const PopupUI = ({ onClose, children }: PopupProps) => {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

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

export const usePopup = () => {
    const [popup, setPopup] = useState<ReactNode | null>(null);

    const open = (content: ReactNode) => {
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
