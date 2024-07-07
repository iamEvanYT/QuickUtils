const { contextBridge, ipcRenderer } = require('electron');

// Switches //
contextBridge.exposeInMainWorld('switches', {
  get: (id) => ipcRenderer.invoke('getSwitches', id),
  set: (id, newState) => ipcRenderer.invoke('setSwitches', id, newState),
})

// Functions //
contextBridge.exposeInMainWorld('functions', {
  setStayAwake: (awake) => ipcRenderer.invoke('setStayAwake', awake),
  quit: () => ipcRenderer.invoke('quit'),
})