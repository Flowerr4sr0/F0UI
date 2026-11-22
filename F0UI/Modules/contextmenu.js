
export const F0UIMODINFO = {
    name: "Context Menu (BUILTIN)",
    author: "F0UI Devs",
    version: "1.0.0",
    dependencies: []
};

//==================================================
// CONTEXT MENU
//==================================================

class CTXTMenu {
    constructor(definition) {
        this.definition = definition;
        this.menu = document.createElement("div");
        this.menu.className = "ctxtmenu";
        this.menu.style.display = "none";

        this.buildItems(definition, this.menu);

        document.body.appendChild(this.menu);

        this.setupEvents();
    }

    //==================================================
    // BUILD MENU ITEMS
    //==================================================

    buildItems(parent, container) {
        for (const child of parent.children) {

            // MENU ITEM
            if (child.tagName === "CTXTMENU-ITEM") {
                const item = document.createElement("button");

                item.type = "button";
                item.className = "ctxtmenu-item";
                item.textContent = child.textContent.trim();

                const action = child.getAttribute("func");

                item.addEventListener("click", (event) => {
                    event.stopPropagation();

                    if (action) {
                        this.runAction(action, child);
                    }

                    this.close();
                });

                container.appendChild(item);
            }

            // SUBMENU FOLDER
            else if (child.tagName === "CTXTMENU-FOLDER") {
                const folder = document.createElement("div");

                folder.className = "ctxtmenu-folder";

                const label = [...child.childNodes]
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent.trim())
                    .filter(Boolean)
                    .join(" ");

                const folderLabel = document.createElement("span");
                folderLabel.textContent = label || "Folder";

                const arrow = document.createElement("span");
                arrow.className = "ctxtmenu-arrow";
                arrow.textContent = "›";

                folder.append(folderLabel, arrow);

                const submenu = document.createElement("div");
                submenu.className = "ctxtmenu-submenu";

                this.buildItems(child, submenu);

                folder.appendChild(submenu);
                container.appendChild(folder);
            }
        }
    }

    //==================================================
    // RUN ACTION
    //==================================================

    runAction(action, element) {
        try {
            // Dispatch a custom event so the page can handle
            // the action without executing arbitrary code.
            const event = new CustomEvent("f0ui-context-action", {
                detail: {
                    action,
                    element,
                    menu: this
                }
            });

            document.dispatchEvent(event);

        } catch (error) {
            console.error("[CTXTMenu] Action error:", error);
        }
    }

    //==================================================
    // EVENTS
    //==================================================

    setupEvents() {
        this.clickType = (
            this.definition.getAttribute("click") || "r"
        ).toLowerCase();

        this.openHandler = (event) => {
            if (this.clickType === "r") {
                event.preventDefault();
                this.open(event.clientX, event.clientY);
            }
        };

        this.leftClickHandler = (event) => {
            if (this.clickType !== "l") return;

            if (this.menu.contains(event.target)) return;

            if (event.target.closest(".ctxtmenu-folder")) return;

            this.open(event.clientX, event.clientY);
        };

        this.closeHandler = (event) => {
            if (!this.menu.contains(event.target)) {
                this.close();
            }
        };

        this.escapeHandler = (event) => {
            if (event.key === "Escape") {
                this.close();
            }
        };

        if (this.clickType === "r") {
            document.addEventListener(
                "contextmenu",
                this.openHandler
            );
        }

        if (this.clickType === "l") {
            document.addEventListener(
                "click",
                this.leftClickHandler
            );
        }

        document.addEventListener("click", this.closeHandler);
        document.addEventListener("keydown", this.escapeHandler);
    }

    //==================================================
    // OPEN
    //==================================================

    open(x, y) {
        this.menu.style.display = "block";

        // Reset submenu visibility
        this.menu.querySelectorAll(".ctxtmenu-folder")
            .forEach(folder => {
                folder.classList.remove("open");
            });

        const rect = this.menu.getBoundingClientRect();

        const left = Math.max(
            5,
            Math.min(x, window.innerWidth - rect.width - 5)
        );

        const top = Math.max(
            5,
            Math.min(y, window.innerHeight - rect.height - 5)
        );

        this.menu.style.left = left + "px";
        this.menu.style.top = top + "px";
    }

    //==================================================
    // CLOSE
    //==================================================

    close() {
        this.menu.style.display = "none";
    }

    //==================================================
    // DESTROY
    //==================================================

    destroy() {
        document.removeEventListener(
            "contextmenu",
            this.openHandler
        );

        document.removeEventListener(
            "click",
            this.leftClickHandler
        );

        document.removeEventListener(
            "click",
            this.closeHandler
        );

        document.removeEventListener(
            "keydown",
            this.escapeHandler
        );

        this.menu.remove();
    }
}

//==================================================
// STYLES
//==================================================

function addContextMenuStyles() {
    if (document.getElementById("f0ui-contextmenu-styles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "f0ui-contextmenu-styles";

    style.textContent = `
        .ctxtmenu {
            position: fixed;
            z-index: 999999;
            min-width: 190px;
            max-width: 280px;
            padding: 5px;
            background: #191e29;
            border: 1px solid #343d50;
            border-radius: 9px;
            box-shadow: 0 12px 35px #0009;
            color: #e8edf7;
            font-family: Arial, sans-serif;
            font-size: 13px;
            user-select: none;
        }

        .ctxtmenu-item {
            display: block;
            width: 100%;
            padding: 10px 12px;
            border: none;
            border-radius: 5px;
            background: transparent;
            color: #dce4f2;
            text-align: left;
            font-size: 13px;
            cursor: pointer;
        }

        .ctxtmenu-item:hover {
            background: #293750;
            color: #9fc5ff;
        }

        .ctxtmenu-folder {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            border-radius: 5px;
            color: #dce4f2;
            cursor: pointer;
        }

        .ctxtmenu-folder:hover {
            background: #293750;
            color: #9fc5ff;
        }

        .ctxtmenu-arrow {
            margin-left: 20px;
            color: #8291aa;
            font-size: 18px;
        }

        .ctxtmenu-submenu {
            display: none;
            position: absolute;
            top: -5px;
            left: calc(100% + 5px);
            min-width: 180px;
            max-width: 260px;
            padding: 5px;
            background: #191e29;
            border: 1px solid #343d50;
            border-radius: 9px;
            box-shadow: 0 12px 35px #0009;
        }

        .ctxtmenu-folder:hover > .ctxtmenu-submenu,
        .ctxtmenu-folder:focus-within > .ctxtmenu-submenu {
            display: block;
        }

        .ctxtmenu-folder:hover > .ctxtmenu-arrow {
            color: #9fc5ff;
        }

        @media (max-width: 500px) {
            .ctxtmenu-submenu {
                left: auto;
                right: 100%;
            }
        }
    `;

    document.head.appendChild(style);
}

//==================================================
// MODULE
//==================================================

let contextMenus = [];

export function enable() {
    addContextMenuStyles();

    document.querySelectorAll("ctxtmenu").forEach(definition => {
        if (definition.dataset.f0uiLoaded === "true") return;

        definition.dataset.f0uiLoaded = "true";

        const menu = new CTXTMenu(definition);
        contextMenus.push(menu);
    });

    console.log("[CTXTMenu] Enabled.");
}

export function disable() {
    contextMenus.forEach(menu => {
        menu.destroy();
    });

    contextMenus = [];

    document.querySelectorAll("ctxtmenu").forEach(definition => {
        delete definition.dataset.f0uiLoaded;
    });

    document.getElementById("f0ui-contextmenu-styles")?.remove();

    console.log("[CTXTMenu] Disabled.");
}
