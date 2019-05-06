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
        if (!paths)
          return;
        let results = [];
        var set = new Set();
        var loc = window.location.pathname;
        var dir = loc.substring(0, loc.lastIndexOf('/')) + '/assets/botFiles/entites.json';
        let rawdata = fs.readFileSync(dir);
        let data = JSON.parse(rawdata);
        for (let i = 0; i < data.length; i++)
          set.add(data[i].name);
        fs.createReadStream(paths[0])
          .pipe(csv(['name', 'examples']))
          .on('data', (data) => results.push(data))
          .on('end', () => {
            for (let i = 0; i < results.length; i++) {
              row = results[i];
              if (row.hasOwnProperty('name') && row.hasOwnProperty('examples') && !set.has(row.name)) {
                let newRow = { name: row.name, examples: row.examples.split('\n') };
                data.push(newRow);
              }
              set.add(row.name);
            }
            fs.writeFile('assets/botFiles/entites.json', JSON.stringify(data, null, 2), (err) => {
              if (err)
                throw err;
            });
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
