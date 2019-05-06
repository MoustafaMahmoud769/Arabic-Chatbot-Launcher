const { ipcRenderer } = require('electron')
const csv = require('csv-parser')
const fs = require('fs')

ipcRenderer.on('open-dialog-paths-selected-intent', (event, arg)=> {
  intents.handler.outputSelectedPathsFromOpenDialog(arg);
})

window.intents = window.intents || {},
function(n) {
    intents.messaging = {

      SendCurrentIntent: function(eventName) {
        let intentName = document.getElementById("intent-name").value;
        let intentExamples = document.getElementById("intent-examples").value;
        let args = {intentName, intentExamples};
        ipcRenderer.send(eventName, args);
        document.getElementById("intent-name").value = '';
        document.getElementById("intent-examples").value = '';
      },

      addIntent: function() {
        intents.messaging.SendCurrentIntent('add-intent');
      },

      validateCurrentIntent: function() {
        intents.messaging.SendCurrentIntent('validate-curr-intent');
      },


      init: function() {
        $('#add-intent').click( function () {
          intents.messaging.addIntent()
        })

        $('#validate-curr-intent').click( function () {
          intents.messaging.validateCurrentIntent()
        })
      }
    };

    intents.handler = {

      loadIntent: function() {
        ipcRenderer.send('show-open-dialog-intent');
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
        $('#load-intent').click( function () {
          intents.handler.loadIntent()
        })
      }
    };

    n(function() {
        intents.messaging.init();
        intents.handler.init();
    })

}(jQuery);
