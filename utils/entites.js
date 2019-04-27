const { ipcMain } = require('electron')

ipcMain.on('add-entity', (event, arg)=> {
    console.log("add entity");
})

ipcMain.on('load-entity', (event, arg)=> {
    console.log("load entity");
})
