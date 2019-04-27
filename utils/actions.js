const { ipcMain } = require('electron')

ipcMain.on('add-action', (event, arg)=> {
    console.log("add action");
})

ipcMain.on('load-action', (event, arg)=> {
    console.log("load action");
})
