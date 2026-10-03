"use strict";

const path = require("path");

// Re-export shared canvasHelper to eliminate duplicated implementation
module.exports = require(path.resolve(__dirname, "../../func/canvasHelper.js"));
