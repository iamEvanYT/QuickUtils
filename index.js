// Config //
const DEV_TOOLS_ENABLED = true

// Code //
const { app, protocol, net, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const path = require("node:path")
const stayAwake = require("stay-awake")

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            devTools: DEV_TOOLS_ENABLED,
            preload: path.join(__dirname, 'preload.js'),
        },
        skipTaskbar: true,
        show: false,
        frame: false,
        resizable: false,
        maximizable: false,
    })

    win.loadFile('public/index.html')

    return win
}

const createTray = () => {
    const tray = new Tray(path.join(__dirname, 'menuBarIconTemplate@2x.png'));

    const popoverWindow = createWindow();

    const toggleWindow = (bounds) => {
        var bounds = bounds ?? tray.getBounds()

        if (popoverWindow.isVisible()) {
            popoverWindow.hide();
        } else {
            const { x, y } = bounds;
            const { height, width } = popoverWindow.getBounds();

            // Position the popover window near the tray icon
            popoverWindow.setBounds({
                x: Math.round(x - width / 2),
                y: Math.round(y),
                width: width,
                height: height
            });

            popoverWindow.show();
        }
    };

    // Context menu
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Toggle', click: () => toggleWindow() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
    ]);

    tray.on('click', (event, bounds) => {
        toggleWindow(bounds);
    });

    tray.on('right-click', () => {
        tray.popUpContextMenu(contextMenu);
    });

    // Hide the window when it loses focus
    popoverWindow.on('blur', () => {
        popoverWindow.hide();
    });
}

app.whenReady().then(() => {
    ipcMain.handle('setStayAwake', (_, awake) => {
        if (awake == true) {
            stayAwake.prevent(function () { });
        } else {
            stayAwake.allow(function () { });
        }
    });

    ipcMain.handle('quit', () => {
        app.quit();
    });
    createTray()

    if (process.platform == 'darwin') {
        app.dock.hide()
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})