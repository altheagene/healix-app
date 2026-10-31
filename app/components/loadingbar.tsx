import React from "react";
import { useNavigation } from "react-router";
import { API_ACTIVITY_EVENT } from "../api";

/*
 * A thin bar across the top of the screen while a page is opening or its data is still
 * on its way. It waits a moment before showing, so quick loads don't make it flicker.
 */

const SHOW_AFTER_MS = 150;

export default function LoadingBar() {
    const navigation = useNavigation();
    const [requests, setRequests] = React.useState(0);
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        const onActivity = (event: Event) => setRequests((event as CustomEvent<number>).detail);
        window.addEventListener(API_ACTIVITY_EVENT, onActivity);
        return () => window.removeEventListener(API_ACTIVITY_EVENT, onActivity);
    }, []);

    const busy = navigation.state !== "idle" || requests > 0;
    React.useEffect(() => {
        if (!busy) { setVisible(false); return; }
        const timer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
        return () => window.clearTimeout(timer);
    }, [busy]);

    if (!visible) return null;
    return (
        <div role="progressbar" aria-label="Loading" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] overflow-hidden bg-leaf-100/60">
            <div className="loading-bar h-full w-1/3 rounded-full bg-leaf-500" />
        </div>
    );
}
