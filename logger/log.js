const { colors } = require('../func/colors.js');
const moment = require("moment-timezone");
const characters = '';
const getCurrentTime = () => {
	const tz = global.GoatBot?.config?.timeZone || global.FloppaBot?.config?.timeZone || "Asia/Dhaka";
	try {
		return colors.gray(moment().tz(tz).format("HH:mm:ss DD/MM/YYYY"));
	} catch (_) {
		return colors.gray(moment().format("HH:mm:ss DD/MM/YYYY"));
	}
};

function logError(prefix, message) {
	if (message === undefined) {
		message = prefix;
		prefix = "ERROR";
	}
	console.log(`${getCurrentTime()} ${colors.redBright(`${characters} ${prefix}:`)}`, message);
	const error = Object.values(arguments).slice(2);
	for (let err of error) {
		if (typeof err == "object" && !err.stack)
			err = JSON.stringify(err, null, 2);
		console.log(`${getCurrentTime()} ${colors.redBright(`${characters} ${prefix}:`)}`, err);
	}
}

module.exports = {
	err: logError,
	error: logError,
	warn: function (prefix, message) {
		if (message === undefined) {
			message = prefix;
			prefix = "WARN";
		}
		console.log(`${getCurrentTime()} ${colors.yellowBright(`${characters} ${prefix}:`)}`, message);
	},
	info: function (prefix, message) {
		if (message === undefined) {
			message = prefix;
			prefix = "INFO";
		}
		console.log(`${getCurrentTime()} ${colors.greenBright(`${characters} ${prefix}:`)}`, message);
	},
	success: function (prefix, message) {
		if (message === undefined) {
			message = prefix;
			prefix = "SUCCES";
		}
		console.log(`${getCurrentTime()} ${colors.cyanBright(`${characters} ${prefix}:`)}`, message);
	},
	master: function (prefix, message) {
		if (message === undefined) {
			message = prefix;
			prefix = "MASTER";
		}
		console.log(`${getCurrentTime()} ${colors.hex("#eb6734", `${characters} ${prefix}:`)}`, message);
	},
	debug: function (prefix, message, ...extra) {
		const isDebug = process.env.DEBUG || process.argv.includes('--debug') || global.GoatBot?.config?.debug;
		if (!isDebug) return;
		if (message === undefined) {
			message = prefix;
			prefix = "DEBUG";
		}
		console.log(`${getCurrentTime()} ${colors.magentaBright(`${characters} [DEBUG] ${prefix}:`)}`, message, ...extra);
	},
	dev: (...args) => {
		if (["development", "production"].includes(process.env.NODE_ENV) == false)
			return;
		try {
			throw new Error();
		}
		catch (err) {
			const at = err.stack.split('\n')[2];
			let position = at.slice(at.indexOf(process.cwd()) + process.cwd().length + 1);
			position.endsWith(')') ? position = position.slice(0, -1) : null;
			console.log(`\x1b[36m${position} =>\x1b[0m`, ...args);
		}
	},
	cmd: function (prefix, message) {
		if (message === undefined) { message = prefix; prefix = "CMD"; }
		console.log(`${getCurrentTime()} ${colors.magentaBright(`${characters} [CMD] ${prefix}:`)}`, message);
	},
	divider: function (label = "") {
		const line = "─".repeat(50);
		if (label) {
			const padded = `──── ${label} `;
			const rest = "─".repeat(Math.max(0, 52 - padded.length));
			console.log(colors.gray(padded + rest));
		} else {
			console.log(colors.gray(line));
		}
	},
	banner: function (lines = []) {
		const width = 52;
		const border = colors.cyanBright("╔" + "═".repeat(width) + "╗");
		const empty  = colors.cyanBright("║" + " ".repeat(width) + "║");
		const foot   = colors.cyanBright("╚" + "═".repeat(width) + "╝");
		console.log(border);
		for (const line of lines) {
			const pad = Math.max(0, width - line.length);
			const left = Math.floor(pad / 2);
			const right = pad - left;
			console.log(colors.cyanBright("║") + " ".repeat(left) + line + " ".repeat(right) + colors.cyanBright("║"));
		}
		console.log(empty);
		console.log(foot);
	}
};