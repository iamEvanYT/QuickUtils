const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('functions', {
  setStayAwake: (awake) => ipcRenderer.invoke('setStayAwake', awake),
  quit: () => ipcRenderer.invoke('quit'),
})