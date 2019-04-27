const { ipcMain } = require('electron')

ipcMain.on('validate-my-model', (event, arg)=> {
    console.log("validate");
})

ipcMain.on('launch-my-model', (event, arg)=> {
    console.log("launch my model");
})

ipcMain.on('launch-example-model', (event, arg)=> {
    console.log("launch example model");
})
