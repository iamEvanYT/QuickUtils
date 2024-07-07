// Config //
const DEV_TOOLS_ENABLED = true
const SCREEN_PADDING = 10 // Padding from screen edges (except the tray side)

const MAX_POPOVER_SCREEN_RATIO_WIDTH = 0.25 // Maximum ratio of screen size for popover
const MAX_POPOVER_SCREEN_RATIO_HEIGHT = 0.5 // Maximum ratio of screen size for popover

// Code //
const { app, protocol, net, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron')
const path = require("node:path")
const stayAwake = require("stay-awake")
require("./modules/switches")()

const createWindow = ({ isPopover, display }) => {
    let width = 800
    let height = 600

    if (isPopover) {
        const maxWidth = Math.floor(display.workAreaSize.width * MAX_POPOVER_SCREEN_RATIO_WIDTH)
        const maxHeight = Math.floor(display.workAreaSize.height * MAX_POPOVER_SCREEN_RATIO_HEIGHT)
        width = Math.min(width, maxWidth)
        height = Math.min(height, maxHeight)
    }

    const win = new BrowserWindow({
        width,
        height,
        webPreferences: {
            devTools: DEV_TOOLS_ENABLED,
            preload: path.join(__dirname, 'preload.js'),
        },
        skipTaskbar: isPopover,
        show: !isPopover,
        frame: !isPopover,
        resizable: !isPopover,
        maximizable: !isPopover,
        alwaysOnTop: isPopover,
    })

    win.loadFile('public/index.html')

    return win
}

let popoverWindow
let normalWindow

const createTray = () => {
    const tray = new Tray(path.join(__dirname, 'menuBarIconTemplate@2x.png'))

    const getTrayPosition = (bounds, display) => {
        const trayXCenter = bounds.x + bounds.width / 2
        const trayYCenter = bounds.y + bounds.height / 2

        const topDist = trayYCenter
        const bottomDist = display.workAreaSize.height - trayYCenter
        const leftDist = trayXCenter
        const rightDist = display.workAreaSize.width - trayXCenter

        const minDist = Math.min(topDist, bottomDist, leftDist, rightDist)

        if (minDist === topDist) return 'top'
        if (minDist === bottomDist) return 'bottom'
        if (minDist === leftDist) return 'left'
        return 'right'
    }

    const positionPopoverWindow = (window, trayBounds, trayPosition, display) => {
        const { height, width } = window.getBounds()
        let x, y

        switch (trayPosition) {
            case 'top':
                x = Math.round(trayBounds.x + (trayBounds.width / 2) - (width / 2))
                y = trayBounds.y + trayBounds.height
                break
            case 'bottom':
                x = Math.round(trayBounds.x + (trayBounds.width / 2) - (width / 2))
                y = trayBounds.y - height
                break
            case 'left':
                x = trayBounds.x + trayBounds.width
                y = Math.round(trayBounds.y + (trayBounds.height / 2) - (height / 2))
                break
            case 'right':
                x = trayBounds.x - width
                y = Math.round(trayBounds.y + (trayBounds.height / 2) - (height / 2))
                break
        }

        // Apply padding to three sides (not the tray side)
        const minX = display.workArea.x + (trayPosition === 'left' ? 0 : SCREEN_PADDING)
        const maxX = display.workArea.x + display.workArea.width - width - (trayPosition === 'right' ? 0 : SCREEN_PADDING)
        const minY = display.workArea.y + (trayPosition === 'top' ? 0 : SCREEN_PADDING)
        const maxY = display.workArea.y + display.workArea.height - height - (trayPosition === 'bottom' ? 0 : SCREEN_PADDING)

        x = Math.max(minX, Math.min(x, maxX))
        y = Math.max(minY, Math.min(y, maxY))

        window.setBounds({ x, y, width, height })
    }

    const toggleWindow = (bounds) => {
        if (popoverWindow && popoverWindow.isVisible()) {
            popoverWindow.hide()
        } else {
            bounds = bounds ?? tray.getBounds()
            const display = screen.getDisplayMatching(bounds)

            if (!popoverWindow) {
                popoverWindow = createWindow({ isPopover: true, display })
            }

            const trayPosition = getTrayPosition(bounds, display)
            positionPopoverWindow(popoverWindow, bounds, trayPosition, display)

            popoverWindow.show()
        }
    }

    // Context menu
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Toggle', click: () => toggleWindow() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
    ])

    tray.on('click', (event, bounds) => {
        toggleWindow(bounds)
    })

    tray.on('right-click', () => {
        tray.popUpContextMenu(contextMenu)
    })

    // Hide the window when it loses focus
    if (popoverWindow) {
        popoverWindow.on('blur', () => {
            popoverWindow.hide()
        })
    }
}

app.whenReady().then(() => {
    ipcMain.handle('setStayAwake', (_, awake) => {
        if (awake) {
            stayAwake.prevent(() => {})
        } else {
            stayAwake.allow(() => {})
        }
    })

    ipcMain.handle('quit', () => {
        app.quit()
    })
    createTray()

    app.on('activate', () => {
        if (!normalWindow) {
            normalWindow = createWindow({ isPopover: false })
            normalWindow.on("close", () => {
                normalWindow = null
            })
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

if (require('electron-squirrel-startup')) {
    app.quit()
}