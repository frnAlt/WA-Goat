const path = require("path");
const config = require("../src/config");
const database = require("../src/database");
const goatUtils = require("../src/utils/goatUtils");

global.GoatBot = global.GoatBot || {};
global.GoatBot.config = config;
global.GoatBot.configCommands = {};

global.utils = {
	...goatUtils,
	log: {
		info: console.log,
		warn: console.warn,
		err: console.error,
		error: console.error
	},
	convertTime: (ms) => goatUtils.convertTime(ms),
	convertBytes: (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`,
	randomString: goatUtils.randomString
};

global.client = global.client || {
	database: {
		creatingThreadData: [],
		creatingUserData: [],
		creatingDashBoardData: [],
		creatingBankData: []
	}
};

const dashBoardDataMock = {
	getAll: async () => [],
	get: async () => null,
	set: async () => {},
	create: async () => ({})
};

global.db = {
	threadsData: database.threadsData,
	usersData: database.usersData,
	globalData: database.globalData,
	dashBoardData: dashBoardDataMock,
	allThreadData: [],
	allUserData: [],
	globalDataArray: [],
	allBankData: []
};

module.exports = async function () {
	await database.init();
	return {
		threadModel: null,
		userModel: null,
		dashBoardModel: null,
		globalModel: null,
		bankModel: null,
		staiHistoryModel: null,
		threadsData: database.threadsData,
		usersData: database.usersData,
		dashBoardData: dashBoardDataMock,
		globalData: database.globalData,
		bankData: null,
		staiHistoryData: null
	};
};