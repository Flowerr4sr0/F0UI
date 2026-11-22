
export const F0UIMODINFO = {
    name: "Popup System",
    author: "F0UI Devs",
    dependencies: [],
    version: "1.0.0"
};

let popupEnabled = false;
let popupContainer = null;
let popupCount = 0;

function createContainer() {
    if (popupContainer) return;

    popupContainer = document.createElement("div");
    popupContainer.id = "f0ui-popup-container";

    Object.assign(popupContainer.style, {
        position: "fixed",
        inset: "0",
        zIndex: "999998",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none"
    });

    document.body.appendChild(popupContainer);
}

function createPopup(title, content, options = {}) {
    if (!popupEnabled) return null;

    createContainer();

    const overlay = document.createElement("div");

    Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        background: "#0008",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
        zIndex: String(999998 + popupCount)
    });

    const box = document.createElement("div");

    Object.assign(box.style, {
        width: "min(420px, calc(100% - 40px))",
        background: "#202020",
        color: "#fff",
        border: "1px solid #444",
        borderRadius: "12px",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 10px 40px #0008"
    });

    const heading = document.createElement("h2");
    heading.textContent = title;

    Object.assign(heading.style, {
        margin: "0 0 15px",
        fontSize: "20px"
    });

    const body = document.createElement("div");
    body.style.marginBottom = "20px";

    if (content instanceof Node) {
        body.appendChild(content);
    } else {
        body.textContent = String(content);
    }

    const closeButton = document.createElement("button");
    closeButton.textContent = options.buttonText || "Close";

    Object.assign(closeButton.style, {
        background: "#fff",
        color: "#202020",
        border: "none",
        borderRadius: "6px",
        padding: "9px 18px",
        cursor: "pointer"
    });

    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "flex-end";
    footer.appendChild(closeButton);

    box.append(heading, body, footer);
    overlay.appendChild(box);
    popupContainer.appendChild(overlay);

    popupCount++;

    let closed = false;

    function close() {
        if (closed) return;
        closed = true;

        overlay.remove();
        popupCount--;

        if (popupCount === 0 && popupContainer) {
            popupContainer.remove();
            popupContainer = null;
        }
    }

    closeButton.addEventListener("click", close);

    if (options.closeOnOverlay !== false) {
        overlay.addEventListener("click", event => {
            if (event.target === overlay) close();
        });
    }

    return { close, element: overlay };
}

function popup(title, content, options = {}) {
    return createPopup(title, content, options);
}

popup.close = function () {
    if (!popupContainer) return;

    popupContainer.querySelectorAll(":scope > div").forEach(el => el.remove());

    popupCount = 0;
    popupContainer.remove();
    popupContainer = null;
};

popup.alert = function (title, message) {
    return popup(title, message);
};

popup.confirm = function (title, message) {
    return new Promise(resolve => {
        if (!popupEnabled) {
            resolve(false);
            return;
        }

        createContainer();

        const overlay = document.createElement("div");

        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            background: "#0008",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
            zIndex: "999999"
        });

        const box = document.createElement("div");

        Object.assign(box.style, {
            width: "min(420px, calc(100% - 40px))",
            background: "#202020",
            color: "white",
            borderRadius: "12px",
            padding: "20px",
            fontFamily: "Arial"
        });

        const heading = document.createElement("h2");
        heading.textContent = title;

        const text = document.createElement("p");
        text.textContent = message;

        const yes = document.createElement("button");
        yes.textContent = "Yes";

        const no = document.createElement("button");
        no.textContent = "No";

        [yes, no].forEach(button => {
            Object.assign(button.style, {
                padding: "9px 18px",
                marginLeft: "8px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
            });
        });

        const footer = document.createElement("div");
        footer.style.textAlign = "right";
        footer.append(no, yes);

        box.append(heading, text, footer);
        overlay.appendChild(box);
        popupContainer.appendChild(overlay);

        popupCount++;

        let finished = false;

        function finish(value) {
            if (finished) return;
            finished = true;

            overlay.remove();
            popupCount--;

            if (popupCount === 0 && popupContainer) {
                popupContainer.remove();
                popupContainer = null;
            }

            resolve(value);
        }

        yes.onclick = () => finish(true);
        no.onclick = () => finish(false);
    });
};

export { popup };

export function enable() {
    popupEnabled = true;
    console.log("[F0UI Popup] Enabled");
}

export function disable() {
    popupEnabled = false;
    popup.close();
    console.log("[F0UI Popup] Disabled");
}
