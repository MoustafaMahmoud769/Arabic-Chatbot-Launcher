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

ipcRenderer.on('send-stories', (event, arg)=> {
  stories.handler.update(arg);
})

ipcRenderer.on('stories-changed', (event, arg)=> {
  stories.messaging.UpdateTable();
})

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
        document.getElementById("story-name").value = '';
        document.getElementById("story-body").value = '';
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
      },

      appendAction: function() {
        newtext = document.getElementById('actions-list').value;
        if (newtext == '')
          return;
        selected = '- ' + newtext + '\n';
        text = document.getElementById('story-body').value + selected;
        document.getElementById('story-body').value = text;
      },

      removeBody: function() {
        let cur = document.getElementById('story-body').value.split('\n');
        if (cur[cur.length - 1] == '')
          cur.pop();
        cur.pop();
        document.getElementById('story-body').value = cur.join('\n');
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
          stories.messaging.UpdateTable()
        })

        $('#intents-list').click( function() {
          stories.messaging.appendIntent()
        })

        $('#actions-list').click( function() {
          stories.messaging.appendAction()
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

      updateIntentsChoices: function(data) {
        stories.handler.setOptions('intents-list', data);
      },

      updateActionsChoices: function(data) {
        stories.handler.setOptions('actions-list', data);
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
        newCell1.innerHTML = data.name;
        let newCell2 = newRow.insertCell(-1);
        for (let i = 0; i < data.examples.length; ++i) {
          newCell2.innerHTML += data.examples[i] + '<br />';
        }
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
