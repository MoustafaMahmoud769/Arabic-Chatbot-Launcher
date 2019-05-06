const { ipcRenderer } = require('electron')
const csv = require('csv-parser')
const fs = require('fs')

ipcRenderer.on('open-dialog-paths-selected-action', (event, arg)=> {
  actions.handler.outputSelectedPathsFromOpenDialog(arg);
})

window.actions = window.actions || {},
function(n) {
    actions.messaging = {

      SendCurrentAction: function(eventName) {
        let actionName = document.getElementById("action-name").value;
        let actionExamples = document.getElementById("action-examples").value;
        let args = {actionName, actionExamples};
        ipcRenderer.send(eventName, args);
        document.getElementById("action-name").value = '';
        document.getElementById("action-examples").value = '';
      },

      addAction: function() {
        actions.messaging.SendCurrentAction('add-action');
      },

      validateCurrentAction: function() {
        actions.messaging.SendCurrentAction('validate-curr-action');
      },

      init: function() {
        $('#add-action').click( function () {
          actions.messaging.addAction()
        })

        $('#validate-curr-action').click( function () {
          actions.messaging.validateCurrentAction()
        })
      }
    };

    actions.handler = {

      loadAction: function() {
        ipcRenderer.send('show-open-dialog-action');
      },

      outputSelectedPathsFromOpenDialog: function(paths) {
        let results = [];
        console.log(paths[0]);
        fs.createReadStream(paths[0])
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            //TODO: Validate
          });
      },

      init: function() {
        $('#load-action').click( function () {
          actions.handler.loadAction()
        })
      }
    };

    n(function() {
        actions.messaging.init();
        actions.handler.init();
    })

}(jQuery);
