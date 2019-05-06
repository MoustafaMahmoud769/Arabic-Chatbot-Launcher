const { ipcRenderer } = require('electron')
const csv = require('csv-parser')
const fs = require('fs')

ipcRenderer.on('open-dialog-paths-selected-entity', (event, arg)=> {
  entites.handler.outputSelectedPathsFromOpenDialog(arg);
})

window.entites = window.entites || {},
function(n) {

    entites.messaging = {
      SendCurrentEntity: function(eventName) {
        let entityName = document.getElementById("entity").value;
        let entityExamples = document.getElementById("entity-examples").value;
        let args = {entityName, entityExamples};
        ipcRenderer.send(eventName, args);
        document.getElementById("entity").value = '';
        document.getElementById("entity-examples").value = '';
      },

      addEntity: function() {
        entites.messaging.SendCurrentEntity('add-entity');
      },

      validateCurrentEntity: function() {
        entites.messaging.SendCurrentEntity('validate-curr-entity');
      },

      init: function() {
        $('#add-entity').click( function () {
          entites.messaging.addEntity();
        })

        $('#validate-curr-entity').click( function () {
          entites.messaging.validateCurrentEntity()
        })
      }
    };

    entites.handler = {

      loadEntity: function() {
        ipcRenderer.send('show-open-dialog-entity');
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
        $('#load-entity').click( function () {
          entites.handler.loadEntity()
        })
      }
    };

    n(function() {
        entites.messaging.init();
        entites.handler.init();
    })

}(jQuery);
