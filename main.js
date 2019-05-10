const setupEvents = require('./installers/setupEvents')
if (setupEvents.handleSquirrelEvent()) {
  return;
}

// globalShortcut
const {app, BrowserWindow, ipcMain} = require('electron')
var url = require('url')
var path = require('path')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({titleBarStyle: 'hidden',
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#312450',
    show: false,
    icon: path.join(__dirname, 'assets/icons/png/64x64.png')
  })
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  mainWindow.webContents.openDevTools()

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.maximize()
  })
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  require('./menu/mainmenu')
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})


require('./utils/dialog')
require('./utils/intents')
require('./utils/entites')
require('./utils/actions')
require('./utils/stories')
require('./utils/slots')
require('./utils/launch')
require('./utils/backend')
