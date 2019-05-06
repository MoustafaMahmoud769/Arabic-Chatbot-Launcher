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
        if (!paths)
          return;
        let results = [];
        var set = new Set();
        var loc = window.location.pathname;
        var dir = loc.substring(0, loc.lastIndexOf('/')) + '/assets/botFiles/actions.json';
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
            fs.writeFile('assets/botFiles/actions.json', JSON.stringify(data, null, 2), (err) => {
              if (err)
                throw err;
            });
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
