const { ipcRenderer } = require('electron')
const fs = require('fs')

ipcRenderer.on('open-dialog-paths-selected-entity', (event, arg)=> {
  entites.handler.outputSelectedPathsFromOpenDialog(arg);
})

ipcRenderer.on('send-entites', (event, arg)=> {
  entites.handler.update(arg);
})

ipcRenderer.on('entites-changed', (event, arg)=> {
  entites.messaging.UpdateTable();
})

window.entites = window.entites || {},
function(n) {

    entites.messaging = {
      SendCurrentEntity: function(eventName) {
        let entityName = document.getElementById("entity").value;
        let args = { entityName };
        ipcRenderer.send(eventName, args);
        document.getElementById("entity").value = '';
      },

      addEntity: function() {
        entites.messaging.SendCurrentEntity('add-entity');
      },

      validateCurrentEntity: function() {
        entites.messaging.SendCurrentEntity('validate-curr-entity');
      },

      UpdateTable: function() {
        ipcRenderer.send('get-entites');
      },

      init: function() {
        $('#add-entity').click( function () {
          entites.messaging.addEntity();
        })

        $('#validate-curr-entity').click( function () {
          entites.messaging.validateCurrentEntity()
        })

        $('#tab2').click( function() {
          entites.messaging.UpdateTable()
        })
      }
    };

    entites.handler = {

      loadEntity: function() {
        ipcRenderer.send('show-open-dialog-entity');
      },

      addHeader: function(tableRef) {
        tableRef.innerHTML = '';
        var header = tableRef.createTHead();
        var row = header.insertRow(0);
        var cell = row.insertCell(0);
        cell.innerHTML = " <b>Name</b>";
        cell = row.insertCell(1);
        cell.innerHTML = " <b>Delete</b>";
      },

      addRow: function(tableRef, data) {
        let newRow = tableRef.insertRow(-1);
        let newCell1 = newRow.insertCell(-1);
        let newText1 = document.createTextNode(data.name);
        newCell1.appendChild(newText1);
        let newCell2 = newRow.insertCell(-1);
        let element = document.createElement("input");
        element.name = "Delete";
        element.type = "input";
        element.value = "Delete";
        element.onclick = function() {
          entites.handler.remove(data.name);
        };
        newCell2.appendChild(element);
      },

      remove: function(name) {
        ipcRenderer.send('remove-entity', name);
      },

      update: function(data) {
        let tableRef = document.getElementById('show-entites');
        entites.handler.addHeader(tableRef);
        for(let i = 0; i < data.length; i++){
          entites.handler.addRow(tableRef, data[i]);
        }
      },

      outputSelectedPathsFromOpenDialog: function(paths) {
        if (!paths)
          return;
        ipcRenderer.send('load-entity', paths[0]);
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
