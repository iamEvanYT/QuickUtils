// Config //
const DEV_TOOLS_ENABLED = true

// Code //
const { app, protocol, net, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron')
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

    const getTrayPosition = (bounds, display) => {
        const trayXCenter = bounds.x + bounds.width / 2;
        const trayYCenter = bounds.y + bounds.height / 2;

        const topDist = trayYCenter;
        const bottomDist = display.bounds.height - trayYCenter;
        const leftDist = trayXCenter;
        const rightDist = display.bounds.width - trayXCenter;

        const minDist = Math.min(topDist, bottomDist, leftDist, rightDist);

        if (minDist === topDist) return 'top';
        if (minDist === bottomDist) return 'bottom';
        if (minDist === leftDist) return 'left';
        if (minDist === rightDist) return 'right';
    };

    const positionPopoverWindow = (window, trayBounds, trayPosition) => {
        const { height, width } = window.getBounds();
        let x, y;

        switch (trayPosition) {
            case 'top':
                x = Math.round(trayBounds.x + (trayBounds.width / 2) - (width / 2));
                y = Math.round(trayBounds.y + trayBounds.height);
                break;
            case 'bottom':
                x = Math.round(trayBounds.x + (trayBounds.width / 2) - (width / 2));
                y = Math.round(trayBounds.y - height);
                break;
            case 'left':
                x = Math.round(trayBounds.x + trayBounds.width);
                y = Math.round(trayBounds.y + (trayBounds.height / 2) - (height / 2));
                break;
            case 'right':
                x = Math.round(trayBounds.x - width);
                y = Math.round(trayBounds.y + (trayBounds.height / 2) - (height / 2));
                break;
        }

        window.setBounds({ x, y, width, height });
    };

    const toggleWindow = (bounds) => {
        var bounds = bounds ?? tray.getBounds()

        if (popoverWindow.isVisible()) {
            popoverWindow.hide();
        } else {
            var bounds = bounds ?? tray.getBounds();
            const display = screen.getDisplayMatching(bounds);

            const trayPosition = getTrayPosition(bounds, display);
            positionPopoverWindow(popoverWindow, bounds, trayPosition);

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

if (require('electron-squirrel-startup')) {
    app.quit()
}