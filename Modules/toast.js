
export const F0UIMODINFO = {
    name: "Toast Notifications",
    author: "F0UI Devs",
    dependencies: [],
    version: "1.0.0"
};

let toastContainer = null;
let toastEnabled = false;

function createToastContainer() {
    if (toastContainer) return;

    toastContainer = document.createElement("div");
    toastContainer.id = "f0ui-toasts";

    Object.assign(toastContainer.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: "999999",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "300px",
        pointerEvents: "none"
    });

    document.body.appendChild(toastContainer);
}

export function toast(message, type = "INFO", duration = 4000) {
    if (!toastEnabled) return;

    createToastContainer();

    const colors = {
        INFO: "#3498db",
        SUCCESS: "#2ecc71",
        WARNING: "#f39c12",
        ERROR: "#e74c3c",
        SYNTAXERROR: "#9b59b6",
        MODERROR: "#e74c3c"
    };

    const notification = document.createElement("div");

    Object.assign(notification.style, {
        background: "#202020",
        color: "#ffffff",
        borderLeft: `4px solid ${colors[type] || colors.INFO}`,
        borderRadius: "8px",
        padding: "14px 16px",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        boxShadow: "0 4px 15px #0005",
        pointerEvents: "auto",
        cursor: "pointer",
        opacity: "0",
        transform: "translateX(30px)",
        transition: "opacity 0.25s, transform 0.25s"
    });

    notification.textContent = message;

    toastContainer.appendChild(notification);

    requestAnimationFrame(() => {
        notification.style.opacity = "1";
        notification.style.transform = "translateX(0)";
    });

    let removed = false;

    function dismiss() {
        if (removed) return;
        removed = true;

        notification.style.opacity = "0";
        notification.style.transform = "translateX(30px)";

        setTimeout(() => {
            notification.remove();

            if (toastContainer && !toastContainer.children.length) {
                toastContainer.remove();
                toastContainer = null;
            }
        }, 250);
    }

    notification.addEventListener("click", dismiss);

    if (duration > 0) {
        setTimeout(dismiss, duration);
    }

    return dismiss;
}

export function enable() {
    toastEnabled = true;
    createToastContainer();

    console.log("[F0UI Toast] Enabled");
}

export function disable() {
    toastEnabled = false;

    if (toastContainer) {
        toastContainer.remove();
        toastContainer = null;
    }

    console.log("[F0UI Toast] Disabled");
}
