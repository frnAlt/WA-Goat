"use strict";

module.exports = function (sock, api, ctx) {
    return function getAppState() {
        return ctx.authState ? ctx.authState.creds : null;
    };
};
