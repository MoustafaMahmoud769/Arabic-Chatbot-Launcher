const { ipcMain, dialog, app } = require('electron')

const options = {
  title: 'Choose CSV file',
  defaultPath: '/',
  //buttonLabel: 'Do it',
  filters: [
    { name: 'csv', extensions: ['csv'] }
  ]
  // properties: ['showHiddenFiles'],
  //message: 'This message will only be shown on macOS'
};

ipcMain.on('show-open-dialog-action', (event, arg)=> {
    dialog.showOpenDialog(null, options, (filePaths) => {
      event.sender.send('open-dialog-paths-selected-action', filePaths)
    });
})

ipcMain.on('show-open-dialog-intent', (event, arg)=> {
    dialog.showOpenDialog(null, options, (filePaths) => {
      event.sender.send('open-dialog-paths-selected-intent', filePaths)
    });
})

ipcMain.on('show-open-dialog-entity', (event, arg)=> {
    dialog.showOpenDialog(null, options, (filePaths) => {
      event.sender.send('open-dialog-paths-selected-entity', filePaths)
    });
})

ipcMain.on('show-open-dialog-story', (event, arg)=> {
    dialog.showOpenDialog(null, options, (filePaths) => {
      event.sender.send('open-dialog-paths-selected-story', filePaths)
    });
})

ipcMain.on('show-error-box', (event, arg) => {
  dialog.showErrorBox('Oops! Something went wrong!', 'Load Failed')
});

ipcMain.on('show-message-box', (event, arg) => {
  const options = {
      type: 'question',
      buttons: ['Cancel', 'Yes, please', 'No, thanks'],
      defaultId: 2,
      title: 'Question',
      message: 'Do you want to do this?',
      detail: 'It does not really matter',
      checkboxLabel: 'Remember my answer',
      checkboxChecked: true,
    };

    dialog.showMessageBox(null, options, (response, checkboxChecked) => {
      event.sender.send('show-message-box-response', [response, checkboxChecked]);
    });
});

ipcMain.on('show-save-dialog', (event, arg) => {
  const options = {
    title: 'Save current page as a pdf',
    defaultPath: app.getPath('documents') + '/electron-tutorial-app.pdf',
  }
  dialog.showSaveDialog(null, options, (path) => {
    console.log(path);
  });
})
