const { ipcRenderer } = require('electron')

ipcRenderer.on('open-dialog-paths-selected-action', (event, arg)=> {
  actions.handler.outputSelectedPathsFromOpenDialog(arg);
})

ipcRenderer.on('send-actions', (event, arg)=> {
  actions.handler.update(arg);
})

ipcRenderer.on('actions-changed', (event, arg)=> {
  actions.messaging.UpdateTable();
})

window.actions = window.actions || {},
function(n) {
    actions.messaging = {

      SendCurrentAction: function(eventName) {
        let actionName = document.getElementById("action-name").value;
        let actionExamples = document.getElementById("action-examples").value;
        let args = {actionName, actionExamples};
        ipcRenderer.send(eventName, args);
      },

      addAction: function() {
        actions.messaging.SendCurrentAction('add-action');
        document.getElementById("action-name").value = '';
        document.getElementById("action-examples").value = '';
      },

      validateCurrentAction: function() {
        actions.messaging.SendCurrentAction('validate-curr-action');
      },

      UpdateTable: function() {
        ipcRenderer.send('get-actions');
      },

      init: function() {
        $('#add-action').click( function () {
          actions.messaging.addAction()
        })

        $('#validate-curr-action').click( function () {
          actions.messaging.validateCurrentAction()
        })

        $('#tab4').click( function() {
          actions.messaging.UpdateTable()
        })
      }
    };

    actions.handler = {

      loadAction: function() {
        ipcRenderer.send('show-open-dialog-action');
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
        cell.innerHTML = " <b>Delete</b>";
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
        let element = document.createElement("input");
        element.name = "Delete";
        element.className = "btn btn-magick";
        element.type = "input";
        element.value = "Delete";
        element.onclick = function() {
          actions.handler.remove(data.name);
        };
        newCell3.appendChild(element);
      },

      remove: function(name) {
        ipcRenderer.send('remove-action', name);
      },

      update: function(data) {
        let tableRef = document.getElementById('show-actions');
        actions.handler.addHeader(tableRef);
        for(let i = 0; i < data.length; i++){
          actions.handler.addRow(tableRef, data[i]);
        }
      },

      outputSelectedPathsFromOpenDialog: function(paths) {
        if (!paths)
          return;
        ipcRenderer.send('load-action', path[0]);
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
