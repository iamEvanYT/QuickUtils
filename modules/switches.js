async function start() {
    const { ipcMain } = require('electron');

    const { default: Store } = await import('electron-store');
    const switchesStore = new Store();

    function getSwitchStatus(id) {
        if (!(id && typeof id == "string")) {
            return null
        }
        
        const state = switchesStore.get(`switches.${id}`);
        return state ?? false
    }

    function setSwitchStatus(id, state) {
        if (!(id && typeof id == "string")) {
            return
        }
        if (!(state && typeof state == "boolean")) {
            return null
        }

        switchesStore.set(`switches.${id}`, state);
        return true
    }

    ipcMain.handle('getSwitches', (_, id) => {
        return getSwitchStatus(id)
    })
    ipcMain.handle('setSwitches', (_, id, state) => {
        return setSwitchStatus(id, state)
    })
}

module.exports = start