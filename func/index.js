/**
 * Unified System Functions Export (func/index.js)
 * High-performance backend engine with typography, math, collections, task runner, and WCA enhancements.
 */

const colors = require("./colors.js");
const configHelper = require("./configHelper.js");
const cooldownManager = require("./cooldownManager.js");
const gracefulShutdown = require("./gracefulShutdown.js");
const mdToText = require("./mdToText.js");
const messageQueue = require("./messageQueue.js");
const spamTracker = require("./spamTracker.js");
const analyticsBatcher = require("./analyticsBatcher.js");
const aiHelper = require("./aiHelper.js");
const systemStats = require("./systemStats.js");
const cacheManager = require("./cacheManager.js");

// Cassidy & Modern Subsystems
const FontSystem = require("./fonts.js");
const styler = require("./styler.js");
const Numero = require("./numero.js");
const BigMath = require("./bigMath.js");
const arielUtils = require("./arielUtils.js");
const collections = require("./collections.js");
const BackgroundTask = require("./backgroundTask.js");
const InputClass = require("./inputClass.js");
const OutputClass = require("./outputClass.js");
const unisym = require("./unisym.js");
const definers = require("./definers.js");
const wcaExtension = require("./wcaExtension.js");
const conduitBridge = require("./conduitBridge.js");
const axeraBridge = require("./axeraBridge.js");
const automationManager = require("./automationManager.js");
const cassidyUtils = require("./cassidyUtils.js");

module.exports = {
  ...colors,
  configHelper,
  cooldownManager,
  gracefulShutdown,
  mdToText,
  messageQueue,
  spamTracker,
  analyticsBatcher,
  aiHelper,
  systemStats,
  cacheManager,
  automationManager,
  botAutomation: automationManager.botAutomation,

  // Typography & Styling
  FontSystem,
  ...styler,

  // Math & Numeric
  Numero,
  BigMath,

  // Ariel Utils & Formatting
  ...arielUtils,

  // Collections & Data
  ...collections,

  // Background Task Engine
  BackgroundTask,
  BackgroundTaskFB: BackgroundTask,

  // Input & Output Context Models
  InputClass,
  OutputClass,

  // Symbols & Definers
  ...unisym,
  ...definers,

  // General Cassidy Utils
  ...cassidyUtils,

  // WCA Extension Layer & Bridges
  wcaExtension,
  extendWCA: wcaExtension,
  extendFCA: wcaExtension,
  conduitBridge,
  axeraBridge,
  privateThreadManager: require("./privateThreadManager.js")
};

