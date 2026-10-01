"use strict";

/**
 * WCA Auto-Update checker
 *
 * Checks npm registry for a newer version of @sheikhtamim/wca
 * and auto-installs it if found.
 *
 * Usage (add to your bot's startup):
 *
 *   const { checkForWCAUpdate } = require('@sheikhtamim/wca/checkUpdate');
 *   await checkForWCAUpdate();       // check + auto-update
 *
 * Or with options:
 *   await checkForWCAUpdate({ autoUpdate: false });  // just check, don't update
 */

const https  = require("https");
const { execSync } = require("child_process");
const fs     = require("fs");
const path   = require("path");

const PKG_NAME    = "@sheikhtamim/wca";
const REGISTRY    = "https://registry.npmjs.org/" + PKG_NAME + "/latest";
const BOT_REPO    = "https://github.com/frnAlt/WA-Goat.git";
const WCA_REPO    = "https://github.com/frnAlt/WA-Goat.git";
const CHANGELOG   = "https://raw.githubusercontent.com/frnAlt/WA-Goat/main/CHANGELOG.md";

// ANSI colours
const C = {
    reset:   "\x1b[0m",
    bold:    "\x1b[1m",
    green:   "\x1b[32m",
    bGreen:  "\x1b[92m",
    yellow:  "\x1b[33m",
    bYellow: "\x1b[93m",
    cyan:    "\x1b[36m",
    red:     "\x1b[31m",
    dim:     "\x1b[2m",
};

function log(color, msg) {
    process.stdout.write(color + msg + C.reset + "\n");
}

/**
 * Fetch a URL and return body as string.
 */
function fetchURL(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { "User-Agent": "wca-update-checker" } }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchURL(res.headers.location).then(resolve).catch(reject);
            }
            let body = "";
            res.on("data", (d) => (body += d));
            res.on("end", () => resolve(body));
        }).on("error", reject);
    });
}

/**
 * Semver comparison.  Returns 1 if a > b, -1 if a < b, 0 if equal.
 */
function compareVersions(a, b) {
    const pa = String(a).split(".").map(Number);
    const pb = String(b).split(".").map(Number);
    for (let i = 0; i < 3; i++) {
        const na = pa[i] || 0, nb = pb[i] || 0;
        if (na > nb) return 1;
        if (na < nb) return -1;
    }
    return 0;
}

/**
 * Get the currently installed WCA version.
 */
function getCurrentVersion() {
    // 1. Own package.json (development / self-reference)
    try {
        const own = path.join(__dirname, "package.json");
        if (fs.existsSync(own)) {
            const p = JSON.parse(fs.readFileSync(own, "utf8"));
            if (p.name === PKG_NAME && p.version) return p.version;
        }
    } catch (_) {}

    // 2. Installed as a dependency inside node_modules
    try {
        const nm = path.join(process.cwd(), "node_modules", PKG_NAME, "package.json");
        if (fs.existsSync(nm)) {
            const p = JSON.parse(fs.readFileSync(nm, "utf8"));
            if (p.version) return p.version;
        }
    } catch (_) {}

    return "0.0.0";
}

/**
 * Install a specific version via npm.
 */
function installVersion(version) {
    const pkg = PKG_NAME + (version ? "@" + version : "");
    log(C.cyan, "  📦  Running: npm install " + pkg + " --save");
    execSync("npm install " + pkg + " --save", {
        cwd: process.cwd(),
        stdio: "inherit",
    });
}

/**
 * Update version reference in the user's package.json.
 */
function patchUserPackageJson(version) {
    try {
        const pkgPath = path.join(process.cwd(), "package.json");
        if (!fs.existsSync(pkgPath)) return;
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        const deps = pkg.dependencies || {};
        if (deps[PKG_NAME] !== undefined) {
            deps[PKG_NAME] = "^" + version;
            pkg.dependencies = deps;
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
            log(C.bGreen, "  ✅  Updated package.json → " + PKG_NAME + "@" + version);
        }
    } catch (_) {}
}

/**
 * Main update-check function.
 *
 * @param {object}  [opts]
 * @param {boolean} [opts.autoUpdate=true]   Install update when found
 * @param {boolean} [opts.silent=false]      Suppress output
 * @param {boolean} [opts.exitOnUpdate=true] Exit process after update (let pm2/nodemon restart)
 * @returns {Promise<boolean>}  true if an update was applied
 */
async function checkForWCAUpdate(opts) {
    opts = Object.assign({ autoUpdate: true, silent: false, exitOnUpdate: true }, opts || {});

    if (!opts.silent) log(C.cyan, "\n  🔍  Checking for WCA updates (" + PKG_NAME + ")…");

    let latestVersion;
    try {
        const body = await fetchURL(REGISTRY);
        const data = JSON.parse(body);
        latestVersion = data.version;
    } catch (e) {
        if (!opts.silent) log(C.red, "  ❌  Could not reach npm registry: " + e.message);
        return false;
    }

    const currentVersion = getCurrentVersion();

    if (compareVersions(latestVersion, currentVersion) <= 0) {
        if (!opts.silent)
            log(C.bGreen, "  ✅  WCA is up to date (v" + currentVersion + ")");
        return false;
    }

    log(C.bYellow, "  ✨  New WCA version available: v" + latestVersion + "  (current: v" + currentVersion + ")");

    // Print changelog if available
    try {
        const changelog = await fetchURL(CHANGELOG);
        const recent = changelog.split("##")[1];
        if (recent) {
            log(C.dim, "\n  📋  Recent changes:");
            recent.split("\n").slice(0, 6).forEach((l) => log(C.dim, "      " + l));
            process.stdout.write("\n");
        }
    } catch (_) {}

    log(C.cyan, "  🔗  WCA repo       : " + WCA_REPO);
    log(C.cyan, "  🤖  Example bot    : " + BOT_REPO);

    if (!opts.autoUpdate) return false;

    log(C.yellow, "  📦  Updating " + PKG_NAME + " → v" + latestVersion + "…");
    try {
        installVersion(latestVersion);
        patchUserPackageJson(latestVersion);
        log(C.bGreen, "  ✅  WCA updated successfully to v" + latestVersion + "!");

        if (opts.exitOnUpdate) {
            log(C.yellow, "  🔄  Restarting to apply update…\n");
            setTimeout(() => process.exit(2), 1000);
        }
        return true;
    } catch (e) {
        log(C.red, "  ❌  Update failed: " + e.message);
        return false;
    }
}

module.exports = { checkForWCAUpdate, getCurrentVersion, compareVersions };
