
class CTXTMenu {
    constructor(definition) {
        this.definition = definition;

        this.menu = document.createElement("div");
        this.menu.className = "ctxtmenu";

        this.buildItems(definition, this.menu);

        document.body.appendChild(this.menu);
        this.menu.style.display = "none";

        this.setupEvents();
    }

    buildItems(parent, container) {
        for (const child of parent.children) {

            if (child.tagName === "CTXTMENU-ITEM") {
                const item = document.createElement("div");

                item.className = "ctxtmenu-item";
                item.textContent = child.textContent.trim();

                const func = child.getAttribute("func");

                item.addEventListener("click", (event) => {
                    event.stopPropagation();

                    if (func) {
                        try {
                            new Function(func)();
                        } catch (error) {
                            console.error("[CTXTMenu]", error);
                        }
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
                    .join(" ");

                folder.textContent = label;

                const submenu = document.createElement("div");
                submenu.className = "ctxtmenu-submenu";

                this.buildItems(child, submenu);

                folder.appendChild(submenu);
                container.appendChild(folder);
            }
        }
    }

    setupEvents() {
        const clickType = this.definition.getAttribute("click");

        if (clickType === "r") {
            document.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                this.open(event.clientX, event.clientY);
            });
        }

        else if (clickType === "l") {
            document.addEventListener("click", (event) => {
                if (this.menu.contains(event.target)) return;

                this.open(event.clientX, event.clientY);
            });
        }

        document.addEventListener("click", (event) => {
            if (!this.menu.contains(event.target)) {
                this.close();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this.close();
            }
        });
    }

    open(x, y) {
        this.menu.style.display = "block";

        const rect = this.menu.getBoundingClientRect();

        this.menu.style.left =
            Math.max(0, Math.min(x, window.innerWidth - rect.width - 5)) + "px";

        this.menu.style.top =
            Math.max(0, Math.min(y, window.innerHeight - rect.height - 5)) + "px";
    }

    close() {
        this.menu.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("ctxtmenu").forEach(definition => {
        new CTXTMenu(definition);
    });
});
