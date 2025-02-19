const { ipcRenderer } = require('electron')

ipcRenderer.on('open-dialog-paths-selected-action', (event, arg)=> {
  actions.handler.outputSelectedPathsFromOpenDialog(arg);
})

ipcRenderer.on('send-actions', (event, arg)=> {
  actions.handler.update(arg);
})

ipcRenderer.on('send-intents', (event, arg)=> {
  actions.handler.updateIntentsChoices(arg);
})

ipcRenderer.on('send-slots', (event, arg)=> {
  actions.handler.updateSlotsChoices(arg);
})

function resert_ui() {
  document.getElementById("action-warning").innerHTML = '';
  document.getElementById("action-name").value = '';
  document.getElementById("action-examples").value = '';
  document.getElementById("action-slots").value = '';
  // account for update
  document.getElementById("actions-normal-buttons").style.display = 'block';
  document.getElementById("actions-update-buttons").style.display = 'none';
  // enable the title textarea
  document.getElementById("action-name").disabled = false;
}

ipcRenderer.on('action-added', (event, arg)=> {
  resert_ui();
})

ipcRenderer.on('actions-changed', (event, arg)=> {
  actions.messaging.UpdateTable();
})

allslots = []

window.actions = window.actions || {},
function(n) {
    actions.messaging = {

      SendCurrentAction: function(eventName, new_input=true) {
        let actionName = document.getElementById("action-name").value;
        let actionExamples = document.getElementById("action-examples").value;
        let actionSlots = document.getElementById("action-slots").value;
        let args = {actionName, actionExamples, actionSlots, new_input};
        ipcRenderer.send(eventName, args);
      },

      addAction: function(new_input=true) {
        actions.messaging.SendCurrentAction('add-action', new_input);
      },

      validateCurrentAction: function(new_input=true) {
        actions.messaging.SendCurrentAction('validate-curr-action', new_input);
      },

      UpdateTable: function() {
        ipcRenderer.send('get-actions');
        ipcRenderer.send('get-intents');
      },

      appendSlotInAction: function() {
        newtext = document.getElementById('slots-in-action').value;
        if (newtext == '')
          return;
        selected = ' {' + newtext + '} ';
        text = document.getElementById('action-examples').value + selected;
        document.getElementById('action-examples').value = text;
        document.getElementById('slots-in-action').value = '';
      },

      handleSlotChange: function() {
        slot = document.getElementById('slots-in-buttons').value;
        if (slot == ''){
          document.getElementById('button-value1').style = 'display:none';
          document.getElementById('button-value2').style = 'display:none;';
          document.getElementById('button-name').style = 'visibility:hidden;';
          return;
        }
        document.getElementById('button-name').style = '';
        for (var i = 0; i < storyslots.length; ++i) {
          if (storyslots[i].name == slot) {
            if (storyslots[i].type == "categorical" || storyslots[i].type == "bool") {
              document.getElementById('button-value1').style = '';
              document.getElementById('button-value2').style = 'display:none;';
              var sel = document.getElementById('button-value1');
              sel.innerHTML = '';
              if(storyslots[i].type == "categorical") {
                for (var j = 0; j < storyslots[i].clist.length; ++j) {
                  var opt = document.createElement('option');
                  opt.appendChild(document.createTextNode(storyslots[i].clist[j]));
                  opt.value = storyslots[i].clist[j];
                  sel.appendChild(opt);
                }
              }
              else {
                var opt1 = document.createElement('option');
                opt1.appendChild(document.createTextNode('True'));
                opt1.value = 'True';
                sel.appendChild(opt1);
                var opt2 = document.createElement('option');
                opt2.appendChild(document.createTextNode('False'));
                opt2.value = 'False';
                sel.appendChild(opt2);
              }
            }
            else {
              document.getElementById('button-value1').style = 'display:none;';
              document.getElementById('button-value2').style = '';
            }
          }
        }
      },

      appendSlotButton: function() {
        intent = document.getElementById('actions-intents-list').value;
        slotname = document.getElementById('slots-in-buttons').value;
        if (slotname == '')
          return;
        displayname = document.getElementById('button-name').value;
        valuechange = '';
        for (var i = 0; i < storyslots.length; ++i) {
          if (storyslots[i].name == slot) {
            if (storyslots[i].type == "categorical" || storyslots[i].type == "bool")
              valuechange = document.getElementById('button-value1').value;
            else
              valuechange = document.getElementById('button-value2').value;
          }
        }
        if (displayname == '' || valuechange == '')
          return;
        selected = 'Button value: ' + displayname + '\n';
        selected += 'Slot name: ' + slotname + '\n';
        selected += 'Slot value: ' + valuechange + '\n';
        selected += 'Activate intent: ' + intent + '\n';
        selected += '\n';
        text = document.getElementById('action-slots').value + selected;
        document.getElementById('action-slots').value = text;
        document.getElementById('button-value1').value = '';
        document.getElementById('button-value2').value = '';
        document.getElementById('button-name').value = '';
        document.getElementById('slots-in-buttons').value = '';
        document.getElementById('actions-intents-list').value = '';
        document.getElementById('button-value1').style = 'display:none;';
        document.getElementById('button-value2').style = 'display:none;';
        document.getElementById('button-name').style = 'visibility:hidden;';
      },

      removeSlotButton: function() {
        let cur = document.getElementById('action-slots').value.split('\n');
        while (cur[cur.length - 1] == '')
          cur.pop();
        cur.pop();
        cur.pop();
        cur.pop();
        cur.pop();
        document.getElementById('action-slots').value = cur.join('\n') + (cur.length > 0 ? '\n' : '');
      },

      init: function() {
        $('#add-action').click( function () {
          actions.messaging.addAction()
        })

        $('#update-action').click( function () {
          actions.messaging.addAction(new_input=false)
        })

        $('#validate-curr-action').click( function () {
          actions.messaging.validateCurrentAction()
        })

       $('#validate-update-action').click( function () {
          actions.messaging.validateCurrentAction(new_input=false)
        })

        $('#cancel-action').click( function () {
          resert_ui();
        })

        $('#add-slots-in-action').click( function () {
          actions.messaging.appendSlotInAction()
        })

        $('#add-action-slot').click( function () {
          actions.messaging.appendSlotButton()
        })

        $('#remove-action-slot').click( function () {
          actions.messaging.removeSlotButton()
        })

        $('#tab4').click( function() {
          slots.messaging.UpdateTable()
          actions.messaging.UpdateTable()
          intents.messaging.UpdateTable()
        })

        $('#slots-in-buttons').change( function() {
          actions.messaging.handleSlotChange()
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
        newCell1.innerHTML = data.name
        // update key
        let newCell4 = newRow.insertCell(-1);
        let element4 = document.createElement("input");
        element4.value = "View/Modify";
        element4.className = "button submit";
        element4.type = "input";
        element4.onclick = function() {
          //delete old one
          // actions.handler.remove(data.name);
          //display title
          document.getElementById("action-name").value = data.name;
          // examples
          let examples_ = ""
          for(let i =0; i<data.examples.length; i++) {
           examples_ += data.examples[i] + '\n';
          }
          document.getElementById("action-examples").value = examples_;
          // slots!
          let slots_ = ""
          for(let i =0; i<data.slots.length; i++) {
           slots_ += data.slots[i] + '\n';
           if((i+1) % 4 == 0) {
             slots_ += '\n';
           }
          }
          document.getElementById("action-slots").value = slots_;
          //display new buttons
          document.getElementById("actions-normal-buttons").style.display = 'none';
          document.getElementById("actions-update-buttons").style.display = 'block';
          //disable title
          document.getElementById("action-name").disabled = true;
          // alert
          // document.getElementById("action-warning").innerHTML = 'This Action was deleted in order for you to modify it, make sure to re-insert it again if you still need it!';
          // swap up
          jQuery('html,body').animate({scrollTop:0},0);
        };
        newCell4.appendChild(element4);
        // delete key
        let newCell5 = newRow.insertCell(-1);
        let element5 = document.createElement("input");
        element5.value = "Delete";
        element5.className = "button submit";
        element5.type = "input";
        element5.onclick = function() {
          actions.handler.remove(data.name);
        };
        newCell5.appendChild(element5);
      },

      remove: function(name) {
        ipcRenderer.send('remove-action', name);
      },

      addOption: function(selname, name, value) {
        var sel = document.getElementById(selname);
        var opt = document.createElement('option');
        opt.appendChild(document.createTextNode(name));
        opt.value = value;
        sel.appendChild(opt);
      },

      updateSlotsChoices: function(data) {
        storyslots = data;
        var sel = document.getElementById('slots-in-buttons');
        var sel2 = document.getElementById('slots-in-action');
        sel.innerHTML = '';
        sel2.innerHTML = '';
        actions.handler.addOption('slots-in-buttons', 'None', '');
        actions.handler.addOption('slots-in-action', 'None', '');
        if (data.length !== 0) {
          for (let i = 0; i < data.length; i++) {
            actions.handler.addOption('slots-in-buttons', data[i].name, data[i].name);
            actions.handler.addOption('slots-in-action', data[i].name, data[i].name);
          }
        }
        document.getElementById('button-value1').style = 'display:none;';
        document.getElementById('button-value2').style = 'display:none;';
        document.getElementById('button-name').style = 'visibility:hidden;';
      },

      updateIntentsChoices: function(data) {
        var sel = document.getElementById('actions-intents-list');
        sel.innerHTML = '';
        var opt = document.createElement('option');
        opt.appendChild(document.createTextNode('None') );
        opt.value = '';
        sel.appendChild(opt);
        if (data.length !== 0) {
          for (let i = 0; i < data.length; i++) {
            var opt = document.createElement('option');
            opt.appendChild(document.createTextNode(data[i].name) );
            opt.value = data[i].name;
            sel.appendChild(opt);
          }
        }
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
