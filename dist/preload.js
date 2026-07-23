"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('knxStudio', {
    platform: process.platform,
    versions: {
        chrome: process.versions.chrome,
        electron: process.versions.electron,
        node: process.versions.node,
    },
});
