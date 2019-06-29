const { ipcRenderer } = require('electron')

ipcRenderer.on('open-dialog-paths-selected-story', (event, arg)=> {
  stories.handler.outputSelectedPathsFromOpenDialog(arg);
})

ipcRenderer.on('send-intents', (event, arg)=> {
  stories.handler.updateIntentsChoices(arg);
})

ipcRenderer.on('send-actions', (event, arg)=> {
  stories.handler.updateActionsChoices(arg);
})

ipcRenderer.on('send-slots', (event, arg)=> {
  stories.handler.updateSlotsChoices(arg);
})

ipcRenderer.on('send-stories', (event, arg)=> {
  stories.handler.update(arg);
})

ipcRenderer.on('stories-changed', (event, arg)=> {
  stories.messaging.UpdateTable();
})

ipcRenderer.on('story-added', (event, arg)=> {
  document.getElementById("story-warning").innerHTML = '';
  document.getElementById("story-name").value = '';
  document.getElementById("story-body").value = '';
})

storyslots = []

window.stories = window.stories || {},
function(n) {

    stories.messaging = {

      SendCurrentStory: function(eventName) {
        let storyName = document.getElementById("story-name").value;
        let storyBody = document.getElementById("story-body").value;
        let args = {storyName, storyBody};
        ipcRenderer.send(eventName, args);
      },

      addStory: function() {
        stories.messaging.SendCurrentStory('add-story');
      },

      validateCurrentStory: function() {
        stories.messaging.SendCurrentStory('validate-curr-story');
      },

      UpdateTable: function() {
        ipcRenderer.send('get-stories');
      },

      appendIntent: function() {
        newtext = document.getElementById('intents-list').value;
        if (newtext == '')
          return;
        selected = '* ' + newtext + '\n';
        text = document.getElementById('story-body').value + selected;
        document.getElementById('story-body').value = text;
        document.getElementById('intents-list').value = '';
      },

      appendAction: function() {
        newtext = document.getElementById('actions-list').value;
        if (newtext == '')
          return;
        selected = '- ' + newtext + '\n';
        text = document.getElementById('story-body').value + selected;
        document.getElementById('story-body').value = text;
        document.getElementById('actions-list').value = '';
      },

      appendSlot: function() {
        newtext = document.getElementById('slots-list').value;
        if (newtext == '')
          return;
        newtext2 = '';
        for (var i = 0; i < storyslots.length; ++i) {
          if (storyslots[i].name == slot) {
            if (storyslots[i].type == "categorical")
              newtext2 = document.getElementById('value1').value;
            else
              newtext2 = document.getElementById('value2').value;
          }
        }
        if (newtext2 == '')
          return;
        selected = '$ ' + newtext + ' -> ' + newtext2 + '\n';
        text = document.getElementById('story-body').value + selected;
        document.getElementById('story-body').value = text;
        document.getElementById('slots-list').value = '';
        document.getElementById('value1').style = 'visibility:hidden;';
        document.getElementById('value2').style = 'visibility:hidden;';
        document.getElementById('value1').value = '';
        document.getElementById('value2').value = '';
      },

      handleSlotChange: function() {
        slot = document.getElementById('slots-list').value;
        if (slot == '')
          return;
        for (var i = 0; i < storyslots.length; ++i) {
          if (storyslots[i].name == slot) {
            if (storyslots[i].type == "categorical") {
              document.getElementById('value1').style = '';
              document.getElementById('value2').style = 'visibility:hidden;';
              var sel = document.getElementById('value1');
              sel.innerHTML = '';
              for (var j = 0; j < storyslots[i].clist.length; ++j) {
                var opt = document.createElement('option');
                opt.appendChild(document.createTextNode(storyslots[i].clist[j]));
                opt.value = storyslots[i].clist[j];
                sel.appendChild(opt);
              }
            }
            else {
              document.getElementById('value1').style = 'visibility:hidden;';
              document.getElementById('value2').style = '';
            }
          }
        }
      },

      removeBody: function() {
        let cur = document.getElementById('story-body').value.split('\n');
        if (cur[cur.length - 1] == '')
          cur.pop();
        cur.pop();
        document.getElementById('story-body').value = cur.join('\n') + '\n';
      },

      init: function() {
        $('#remove-body').click( function () {
          stories.messaging.removeBody()
        })

        $('#add-story').click( function () {
          stories.messaging.addStory()
        })

        $('#validate-curr-story').click( function () {
          stories.messaging.validateCurrentStory()
        })

        $('#tab5').click( function() {
          intents.messaging.UpdateTable()
          actions.messaging.UpdateTable()
          slots.messaging.UpdateTable()
          stories.messaging.UpdateTable()
        })

        $('#intents-list').change( function() {
          stories.messaging.appendIntent()
        })

        $('#actions-list').change( function() {
          stories.messaging.appendAction()
        })

        $('#slots-list').change( function() {
          stories.messaging.handleSlotChange()
        })

        $('#add-story-slot').click( function () {
          stories.messaging.appendSlot()
        })
      }

    };

    stories.handler = {

      loadStory: function() {
        ipcRenderer.send('show-open-dialog-story');
      },

      setOptions: function(optionName, data) {
        var sel = document.getElementById(optionName);
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

      updateIntentsChoices: function(data) {
        stories.handler.setOptions('intents-list', data);
      },

      updateActionsChoices: function(data) {
        stories.handler.setOptions('actions-list', data);
      },

      updateSlotsChoices: function(data) {
        storyslots = data;
        var sel = document.getElementById('slots-list');
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
          stories.handler.remove(data.name);
          document.getElementById("story-name").value = data.name;
          let examples_ = ""
          for(let i =0; i<data.examples.length; i++) {
           examples_ += data.examples[i] + '\n';
          }
          document.getElementById("story-body").value = examples_;
          document.getElementById("story-warning").innerHTML = 'This Story was deleted in order for you to modify it, make sure to re-insert it again if you still need it!';
          jQuery('html,body').animate({scrollTop:0},0);
        };
        newCellx.appendChild(elementx);
        // delete key
        let newCell3 = newRow.insertCell(-1);
        let element = document.createElement("input");
        element.value = "Delete";
        element.className = "button submit";
        element.type = "input";
        element.onclick = function() {
          stories.handler.remove(data.name);
        };
        newCell3.appendChild(element);
      },

      remove: function(name) {
        ipcRenderer.send('remove-story', name);
      },

      update: function(data) {
        let tableRef = document.getElementById('show-stories');
        stories.handler.addHeader(tableRef);
        for(let i = 0; i < data.length; i++){
          stories.handler.addRow(tableRef, data[i]);
        }
      },

      outputSelectedPathsFromOpenDialog: function(paths) {
        if (!paths)
          return;
        ipcRenderer.send('load-story', paths[0]);
      },

      init: function() {
        $('#load-story').click( function () {
          stories.handler.loadStory()
        })
      }
    };

    n(function() {
        stories.messaging.init();
        stories.handler.init();
    })
}(jQuery);
