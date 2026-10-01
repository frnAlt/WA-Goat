"use strict";

/**
 * Floppa-WCA Module Status & Update Checker
 *
 * Floppa-WCA is integrated as a local repository package (non-npm uploaded).
 *
 * Usage (add to your bot's startup):
 *
 *   const { checkForWCAUpdate } = require('floppa-wca/checkUpdate');
 *   await checkForWCAUpdate();
 */

const https  = require("https");
const { execSync } = require("child_process");
const fs     = require("fs");
const path   = require("path");

const PKG_NAME    = "floppa-wca";
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
    const currentVersion = getCurrentVersion();

    if (!opts.silent) {
        log(C.bGreen, "  ✅  Floppa-WCA is running as an integrated local module (v" + currentVersion + ")");
    }
    return false;
}

module.exports = { checkForWCAUpdate, getCurrentVersion, compareVersions };
