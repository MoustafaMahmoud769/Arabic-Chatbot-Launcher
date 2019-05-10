const { ipcRenderer } = require('electron')

ipcRenderer.on('open-dialog-paths-selected-intent', (event, arg)=> {
  intents.handler.outputSelectedPathsFromOpenDialog(arg);
})

ipcRenderer.on('send-entites', (event, arg)=> {
  intents.handler.updateChoices(arg);
})

ipcRenderer.on('send-intents', (event, arg)=> {
  intents.handler.update(arg);
})

ipcRenderer.on('intents-changed', (event, arg)=> {
  intents.messaging.UpdateTable();
})

window.intents = window.intents || {},
function(n) {
    intents.messaging = {

      SendCurrentIntent: function(eventName) {
        let intentName = document.getElementById("intent-name").value;
        let intentExamples = document.getElementById("intent-examples").value;
        let intentEntites = document.getElementById("intent-entites").value;
        let args = {intentName, intentExamples, intentEntites};
        ipcRenderer.send(eventName, args);
      },

      addIntentEntity: function() {
        let attr = [];
        attr.push(document.getElementById("intent-entity-from").value);
        attr.push(document.getElementById("intent-entity-to").value);
        attr.push(document.getElementById("intent-entity-idx").value);
        attr.push(document.getElementById("intent-entity-name").value);
        let text = attr.join('\t') + '\n';
        let cur = document.getElementById("intent-entites").value;
        cur += text;
        document.getElementById("intent-entites").value = cur;
        document.getElementById("intent-entity-from").value = '';
        document.getElementById("intent-entity-to").value = '';
        document.getElementById("intent-entity-idx").value = '';
      },

      removeIntentEntity: function() {
        let cur = document.getElementById("intent-entites").value.split('\n');
        if (cur[cur.length - 1] == '')
          cur.pop();
        cur.pop();
        document.getElementById("intent-entites").value = cur.join('\n');
      },

      addIntent: function() {
        intents.messaging.SendCurrentIntent('add-intent');
        document.getElementById("intent-name").value = '';
        document.getElementById("intent-examples").value = '';
        document.getElementById("intent-entites").value = '';
      },

      validateCurrentIntent: function() {
        intents.messaging.SendCurrentIntent('validate-curr-intent');
      },

      UpdateTable: function() {
        ipcRenderer.send('get-intents');
      },

      init: function() {
        $('#add-intent-entity').click( function () {
          intents.messaging.addIntentEntity()
        })

        $('#remove-intent-entity').click( function () {
          intents.messaging.removeIntentEntity()
        })

        $('#add-intent').click( function () {
          intents.messaging.addIntent()
        })

        $('#validate-curr-intent').click( function () {
          intents.messaging.validateCurrentIntent()
        })

        $('#tab3').click( function() {
          entites.messaging.UpdateTable()
          intents.messaging.UpdateTable()
        })
      }
    };

    intents.handler = {

      updateChoices: function(data) {
        var sel = document.getElementById('intent-entity-name');
        sel.innerHTML = '';
        if (data.length !== 0) {
          for (let i = 0; i < data.length; i++) {
            var opt = document.createElement('option');
            opt.appendChild(document.createTextNode(data[i].name) );
            opt.value = data[i].name;
            sel.appendChild(opt);
          }
        }
        else {
          var opt = document.createElement('option');
          opt.appendChild(document.createTextNode('None') );
          opt.value = '';
          sel.appendChild(opt);
        }
      },

      loadIntent: function() {
        ipcRenderer.send('show-open-dialog-intent');
      },

      addHeader: function(tableRef) {
        tableRef.innerHTML = '';
        var header = tableRef.createTHead();
        var row = header.insertRow(0);
        var cell = row.insertCell(0);
        cell.innerHTML = " <b>Name</b>";
        cell = row.insertCell(1);
        cell.innerHTML = " <b>Examples</b>";
        cell = row.insertCell(2);
        cell.innerHTML = " <b>Entites</b>";
        cell = row.insertCell(3);
        cell.innerHTML = " <b>Delete</b>";
      },

      handleEntites: function(data) {
        let ret = []
        for (let i = 0; i < data.length; ++i) {
          let text = data[i].from + '\t' + data[i].to + '\t' + data[i].value + '\t' + data[i].name;
          ret.push(text);
        }
        return ret.join('\n');
      },

      addRow: function(tableRef, data) {
        let newRow = tableRef.insertRow(-1);
        let newCell1 = newRow.insertCell(-1);
        let newText1 = document.createTextNode(data.name);
        newCell1.appendChild(newText1);
        let newCell2 = newRow.insertCell(-1);
        let newText2 = document.createTextNode(data.examples.join('\n'));
        newCell2.appendChild(newText2);
        let newCell3 = newRow.insertCell(-1);
        let newText3 = document.createTextNode(intents.handler.handleEntites(data.entites));
        newCell3.appendChild(newText3);
        let newCell4 = newRow.insertCell(-1);
        let element = document.createElement("input");
        element.name = "Delete";
        element.className = "btn btn-magick";
        element.type = "input";
        element.value = "Delete";
        element.onclick = function() {
          intents.handler.remove(data.name);
        };
        newCell4.appendChild(element);
      },

      remove: function(name) {
        ipcRenderer.send('remove-intent', name);
      },

      update: function(data) {
        let tableRef = document.getElementById('show-intents');
        intents.handler.addHeader(tableRef);
        for(let i = 0; i < data.length; i++){
          intents.handler.addRow(tableRef, data[i]);
        }
      },

      outputSelectedPathsFromOpenDialog: function(paths) {
        if (!paths)
          return;
        ipcRenderer.send('load-intent', path[0]);
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
