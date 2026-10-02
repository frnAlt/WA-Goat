"use strict";

/**
 * Universal Module Aliases for Baileys & Floppa-WCA Bot
 * Redirects legacy/incompatible native packages to modern JS/N-API alternatives
 */

const Module = require("module");
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === "canvas") {
    return originalLoad("@napi-rs/canvas", parent, isMain);
  }
  if (request === "gifencoderv2") {
    return originalLoad("gif-encoder-2", parent, isMain);
  }
  return originalLoad.apply(this, arguments);
};

module.exports = true;
