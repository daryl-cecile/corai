import { hydrateRoot } from "react-dom/client";
import { parseJSX } from "../cli/server/jsxHelper";

declare let window: Window & globalThis.Window & { __INITIAL_JSX_STRING__:string }

(function() {
    const clientJSX = parseJSX(window.__INITIAL_JSX_STRING__);

    const root = hydrateRoot(document, clientJSX);
    let currentPathname = window.location.pathname;

    async function fetchClientJSX(pathName:string) {
        const response = await fetch(pathName + "?jsx");
        const clientJSXString = await response.text();
        const clientJSX = parseJSX(clientJSXString);
        return clientJSX;
    }

    async function navigate(pathName:string) {
        currentPathname = pathName;
        const clientJSX = await fetchClientJSX(pathName);
        if (pathName === currentPathname) {
            root.render(clientJSX);
        }
    }

    window.addEventListener("click", (e) => {
        const element:HTMLElement = e.target as any;

        if (element.tagName !== "A") return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;


        const href = element.getAttribute("href");
        if (!href?.startsWith("/")) return;

        e.preventDefault();
        
        window.history.pushState(null, "", href);
        
        navigate(href);

    }, true );
    
    window.addEventListener("popstate", () => {
        navigate(window.location.pathname);
    });
    
    
})();