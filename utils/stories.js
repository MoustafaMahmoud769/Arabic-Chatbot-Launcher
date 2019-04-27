const { ipcMain } = require('electron')

ipcMain.on('add-story', (event, arg)=> {
    console.log("add story");
})

ipcMain.on('load-story', (event, arg)=> {
    console.log("load story");
})
