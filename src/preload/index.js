import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  send: (channel, data) => {
    let validChannel = ["toMain"];
    if (validChannel.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
});
