
const F0UIMODLOADED = [];

let f0uimenuVisible = false;

//==================================================
// NOTIFICATIONS
//==================================================

function f0uiNotify(message, type = "INFO") {
    if (typeof window.toast === "function") {
        window.toast(message, type);
    } else {
        console.log(`[F0UI ${type}] ${message}`);
    }
}

//==================================================
// MENU
//==================================================

function f0uimenu() {
    const menu = document.getElementById("f0ui-mod-menu");

    if (!menu) return;

    f0uimenuVisible = !f0uimenuVisible;
    menu.style.display = f0uimenuVisible ? "block" : "none";
}

function createF0UIMenu() {
    if (document.getElementById("f0ui-mod-menu")) return;

    const menu = document.createElement("div");

    menu.id = "f0ui-mod-menu";
    menu.style.display = "none";

    menu.innerHTML = `
        <h1>F0UI</h1>
        <h3>Mods</h3>
        <div id="f0ui-mod-list"></div>
    `;

    document.body.appendChild(menu);
}

//==================================================
// RENDER MOD
//==================================================

function renderF0UIMod(mod) {
    const list = document.getElementById("f0ui-mod-list");

    if (!list) return;

    const container = document.createElement("div");
    container.className = "mod";
    container.dataset.mod = mod.src;

    // Name
    const name = document.createElement("p");
    name.textContent = mod.name;

    // Built-in indicator
    if (mod.builtIn) {
        const indicator = document.createElement("span");

        indicator.textContent = " BUILT-IN";
        indicator.className = "f0ui-builtin-indicator";

        indicator.style.cssText = `
            display: inline-block;
            margin-left: 8px;
            padding: 3px 6px;
            border-radius: 4px;
            background: #303f5c;
            color: #9fc5ff;
            font-size: 10px;
            font-weight: bold;
            vertical-align: middle;
        `;

        name.appendChild(indicator);
    }

    // Author
    const author = document.createElement("p");
    author.textContent = mod.author || "Unknown";

    // Version
    const version = document.createElement("p");
    version.textContent = "Version: " + mod.version;

    // Dependencies
    const dependencies = document.createElement("p");
    dependencies.textContent =
        "Dependencies: " + (mod.dependencies || []).join(", ");

    // Status
    const status = document.createElement("p");
    status.textContent = "Status: " + mod.status;

    // Toggle
    const toggle = document.createElement("button");

    toggle.textContent = mod.enabled ? "ON" : "OFF";
    toggle.disabled = !mod.module || mod.status === "Failed" ||
        mod.status === "Syntax Error";

    toggle.addEventListener("click", async () => {
        toggle.disabled = true;

        try {
            if (!mod.enabled) {
                if (typeof mod.module.enable === "function") {
                    await mod.module.enable();
                }

                mod.enabled = true;
                mod.status = "Enabled";
            } else {
                if (typeof mod.module.disable === "function") {
                    await mod.module.disable();
                }

                mod.enabled = false;
                mod.status = "Disabled";
            }

            status.textContent = "Status: " + mod.status;
            toggle.textContent = mod.enabled ? "ON" : "OFF";

        } catch (error) {
            console.error("[F0UI] Mod toggle error:", error);

            f0uiNotify(
                `Mod ${mod.name} failed to toggle.`,
                "MODERROR"
            );
        } finally {
            toggle.disabled = false;
        }
    });

    container.append(
        name,
        author,
        version,
        dependencies,
        status,
        toggle
    );

    list.appendChild(container);
}

//==================================================
// LOAD MOD
//==================================================

async function loadF0UIMod(modInfo) {
    let modName = modInfo.name || modInfo.src;

    // Prevent duplicates
    const existing = F0UIMODLOADED.find(
        mod => mod.src === modInfo.src
    );

    if (existing) {
        return existing;
    }

    try {
        const module = await import(modInfo.src);

        const info = module.F0UIMODINFO;

        if (!info) {
            throw new Error("Missing F0UIMODINFO export");
        }

        modName = info.name || modName;

        if (typeof module.toast === "function") {
            window.toast = module.toast;
        }

        const mod = {
            src: modInfo.src,
            name: modName,
            author: info.author || "Unknown",
            dependencies: info.dependencies || [],
            version: info.version || "Unknown",
            module: module,
            builtIn: modInfo.builtIn === true,
            enabled: false,
            status: "Loaded"
        };

        // Enable module on startup
        if (typeof module.enable === "function") {
            await module.enable();
        }

        mod.enabled = true;
        mod.status = "Enabled";

        F0UIMODLOADED.push(mod);

        renderF0UIMod(mod);

        console.log(`[F0UI] Loaded: ${modName}`);

        return mod;

    } catch (error) {
        console.error(`[F0UI] Failed to load ${modName}:`, error);

        const isSyntaxError =
            error instanceof SyntaxError ||
            error.name === "SyntaxError";

        f0uiNotify(
            isSyntaxError
                ? `Error ${modName} has a syntax error. Mod will not load.`
                : `Error ${modName} failed to load.`,
            isSyntaxError ? "SYNTAXERROR" : "MODERROR"
        );

        const failedMod = {
            src: modInfo.src,
            name: modName,
            author: "Unknown",
            dependencies: [],
            version: "Unknown",
            status: isSyntaxError ? "Syntax Error" : "Failed",
            enabled: false,
            builtIn: modInfo.builtIn === true,
            module: null
        };

        F0UIMODLOADED.push(failedMod);
        renderF0UIMod(failedMod);

        return null;
    }
}

//==================================================
// READ TEXT FILE
//==================================================

async function readModList(path) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(
            `Failed to read ${path}: HTTP ${response.status}`
        );
    }

    return (await response.text())
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith("#"));
}

//==================================================
// STARTUP MOD LOADER
//==================================================

document.addEventListener("DOMContentLoaded", async () => {
    createF0UIMenu();

    try {
        // Read both text files
        const [modPaths, builtinPaths] = await Promise.all([
            readModList("./mods.txt"),
            readModList("./builtinmods.txt")
        ]);

        console.log(`[F0UI] Found ${modPaths.length} mods.`);

        // Load every module listed in mods.txt
        for (const path of modPaths) {
            const isBuiltIn = builtinPaths.includes(path);

            await loadF0UIMod({
                src: path,
                name: path.split("/").pop().replace(/\.js$/i, ""),
                builtIn: isBuiltIn
            });
        }

        console.log("[F0UI] Mod loading complete.");

        f0uiNotify(
            `Loaded ${F0UIMODLOADED.filter(mod => mod.enabled).length} mods.`,
            "SUCCESS"
        );

    } catch (error) {
        console.error("[F0UI] Startup loading error:", error);

        f0uiNotify(
            "Failed to load F0UI mod lists.",
            "MODERROR"
        );
    }
});

//==================================================
// IMPORT CUSTOM MOD
//==================================================

async function importmod(urlorpath) {
    const existing = F0UIMODLOADED.find(
        mod => mod.src === urlorpath
    );

    if (existing) {
        f0uiNotify(
            `Mod ${existing.name} is already imported.`,
            "WARNING"
        );

        return existing;
    }

    const mod = await loadF0UIMod({
        src: urlorpath,
        name: urlorpath.split("/").pop().split("?")[0],
        builtIn: false
    });

    if (mod) {
        f0uiNotify(
            `${mod.name} imported successfully!`,
            "SUCCESS"
        );
    }

    return mod;
}

//==================================================
// GLOBAL FUNCTIONS
//==================================================

window.f0uimenu = f0uimenu;
window.importmod = importmod;
window.F0UIMODLOADED = F0UIMODLOADED;
window.f0uiNotify = f0uiNotify;
