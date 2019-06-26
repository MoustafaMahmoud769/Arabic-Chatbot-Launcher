const { ipcRenderer } = require('electron')

ipcRenderer.on('open-dialog-paths-selected-entity', (event, arg)=> {
  entites.handler.outputSelectedPathsFromOpenDialog(arg);
})

ipcRenderer.on('send-entites', (event, arg)=> {
  entites.handler.update(arg);
})

ipcRenderer.on('entity-added', (event, arg)=> {
  document.getElementById("entity-warning").innerHTML = '';
  document.getElementById("entity").value = '';
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
        cell.innerHTML = " <b></b>";
        cell = row.insertCell(1);
        cell.innerHTML = " <b></b>";
        cell = row.insertCell(2);
        cell.innerHTML = " <b></b>";
      },

      addRow: function(tableRef, data) {
        // add new row
        let newRow = tableRef.insertRow(-1);
        // action name
        let newCell1 = newRow.insertCell(-1);
        newCell1.innerHTML = data.name;
        // update key
        let newCellx = newRow.insertCell(-1);
        let elementx = document.createElement("input");
        elementx.value = "Display/Modify";
        elementx.className = "button submit";
        elementx.type = "input";
        elementx.onclick = function() {
          entites.handler.remove(data.name);
          document.getElementById("entity").value = data.name;
          document.getElementById("entity-warning").innerHTML = 'This Entity was deleted in order for you to modify it, make sure to re-insert it again if you still need it!';
          jQuery('html,body').animate({scrollTop:0},0);
        };
        newCellx.appendChild(elementx);
        // delete key
        let newCell2 = newRow.insertCell(-1);
        let element = document.createElement("input");
        element.value = "Delete";
        element.className = "button submit";
        element.type = "input";
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
