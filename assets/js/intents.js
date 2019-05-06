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
        if (!paths)
          return;
        let results = [];
        var set = new Set();
        var loc = window.location.pathname;
        var dir = loc.substring(0, loc.lastIndexOf('/')) + '/assets/botFiles/intents.json';
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
            fs.writeFile('assets/botFiles/intents.json', JSON.stringify(data, null, 2), (err) => {
              if (err)
                throw err;
            });
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
