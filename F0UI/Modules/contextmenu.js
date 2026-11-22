
export const F0UIMODINFO = {
    name: "Context Menu (BUILTIN)",
    author: "F0UI Devs",
    version: "1.1.0",
    dependencies: []
};

let contextMenus = [];
let initialized = false;

//==================================================
// CSS
//==================================================

function addStyles() {
    if (document.getElementById("f0ui-ctxtmenu-css")) return;

    const style = document.createElement("style");
    style.id = "f0ui-ctxtmenu-css";

    style.textContent = `
        .ctxtmenu {
            position: fixed;
            z-index: 999999;
            display: none;
            min-width: 190px;
            padding: 5px;
            background: #191e29;
            border: 1px solid #343d50;
            border-radius: 9px;
            box-shadow: 0 12px 35px #0009;
            color: #e8edf7;
            font: 13px Arial, sans-serif;
        }

        .ctxtmenu-item,
        .ctxtmenu-folder {
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 10px 12px;
            border: 0;
            border-radius: 5px;
            background: transparent;
            color: #dce4f2;
            text-align: left;
            font: inherit;
            cursor: pointer;
        }

        .ctxtmenu-item:hover,
        .ctxtmenu-folder:hover {
            background: #293750;
            color: #9fc5ff;
        }

        .ctxtmenu-folder {
            position: relative;
        }

        .ctxtmenu-arrow {
            margin-left: 20px;
            font-size: 18px;
        }

        .ctxtmenu-submenu {
            display: none;
            position: absolute;
            top: -5px;
            left: calc(100% + 5px);
            min-width: 180px;
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

        .ctxtmenu-folder:last-child .ctxtmenu-submenu {
            margin-bottom: 0;
        }
    `;

    document.head.appendChild(style);
}

//==================================================
// CONTEXT MENU CLASS
//==================================================

class CTXTMenu {
    constructor(definition) {
        this.definition = definition;

        this.menu = document.createElement("div");
        this.menu.className = "ctxtmenu";

        this.buildItems(definition, this.menu);

        document.body.appendChild(this.menu);

        this.clickType = (
            definition.getAttribute("click") || "r"
        ).toLowerCase();

        this.onContextMenu = (event) => {
            if (this.clickType !== "r") return;

            event.preventDefault();
            this.open(event.clientX, event.clientY);
        };

        this.onDocumentClick = (event) => {
            if (this.clickType === "l" && !this.menu.contains(event.target)) {
                this.open(event.clientX, event.clientY);
                return;
            }

            if (!this.menu.contains(event.target)) {
                this.close();
            }
        };

        this.onKeyDown = (event) => {
            if (event.key === "Escape") {
                this.close();
            }
        };

        document.addEventListener("contextmenu", this.onContextMenu);
        document.addEventListener("click", this.onDocumentClick);
        document.addEventListener("keydown", this.onKeyDown);
    }

    //==================================================
    // BUILD ITEMS
    //==================================================

    buildItems(parent, container) {
        for (const child of parent.children) {

            if (child.tagName === "CTXTMENU-ITEM") {
                const item = document.createElement("button");

                item.type = "button";
                item.className = "ctxtmenu-item";
                item.textContent = child.textContent.trim();

                const action = child.getAttribute("func");

                item.addEventListener("click", (event) => {
                    event.stopPropagation();

                    if (action) {
                        document.dispatchEvent(
                            new CustomEvent("f0ui-context-action", {
                                detail: {
                                    action,
                                    element: child
                                }
                            })
                        );
                    }

                    this.close();
                });

                container.appendChild(item);
            }

            else if (child.tagName === "CTXTMENU-FOLDER") {
                const folder = document.createElement("div");
                folder.className = "ctxtmenu-folder";

                const label = [...child.childNodes]
                    .filter(node => node.nodeType === Node.TEXT_NODE)
                    .map(node => node.textContent.trim())
                    .filter(Boolean)
                    .join(" ") || "Folder";

                const labelElement = document.createElement("span");
                labelElement.textContent = label;

                const arrow = document.createElement("span");
                arrow.className = "ctxtmenu-arrow";
                arrow.textContent = "›";

                folder.append(labelElement, arrow);

                const submenu = document.createElement("div");
                submenu.className = "ctxtmenu-submenu";

                this.buildItems(child, submenu);

                folder.appendChild(submenu);
                container.appendChild(folder);
            }
        }
    }

    //==================================================
    // OPEN
    //==================================================

    open(x, y) {
        this.menu.style.display = "block";

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
        document.removeEventListener("contextmenu", this.onContextMenu);
        document.removeEventListener("click", this.onDocumentClick);
        document.removeEventListener("keydown", this.onKeyDown);

        this.menu.remove();
    }
}

//==================================================
// ENABLE / DISABLE
//==================================================

export function enable() {
    if (initialized) return;

    initialized = true;
    addStyles();

    document.querySelectorAll("ctxtmenu").forEach(definition => {
        if (definition.dataset.f0uiLoaded === "true") return;

        definition.dataset.f0uiLoaded = "true";
        contextMenus.push(new CTXTMenu(definition));
    });

    console.log("[F0UI Context Menu] Enabled:", contextMenus.length);
}

export function disable() {
    contextMenus.forEach(menu => menu.destroy());

    contextMenus = [];
    initialized = false;

    document.querySelectorAll("ctxtmenu").forEach(definition => {
        delete definition.dataset.f0uiLoaded;
    });

    document.getElementById("f0ui-ctxtmenu-css")?.remove();

    console.log("[F0UI Context Menu] Disabled.");
}

//==================================================
// AUTO INITIALIZE
//==================================================

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enable, { once: true });
} else {
    enable();
}
