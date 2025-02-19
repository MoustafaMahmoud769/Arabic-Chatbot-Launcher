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

function reset_ui() {
  document.getElementById("intent-warning").innerHTML = '';
  document.getElementById("intent-name").value = '';
  document.getElementById("intent-examples").value = '';
  document.getElementById("intent-entites").value = '';
  document.getElementById("intent-entites-cool").value = '';
  // account for update
  document.getElementById("intents-normal-buttons").style.display = 'block';
  document.getElementById("intents-update-buttons").style.display = 'none';
  // enable the title textarea
  document.getElementById("intent-name").disabled = false;
  // selected text
  document.getElementById("entity-selected-text").value = '';
  // index
  document.getElementById("intent-entity-from").value = 0;
  document.getElementById("intent-entity-to").value = 0;
  document.getElementById("intent-entity-idx").value = 0;
}

ipcRenderer.on('intent-added', (event, arg)=> {
  reset_ui();
})

ipcRenderer.on('intents-changed', (event, arg)=> {
  intents.messaging.UpdateTable();
})

function add_to_cool(value, entity) {
  let cur = document.getElementById("intent-entites-cool").value;
  cur += "{" + value + ", " + entity + "}" + '\n';
  document.getElementById("intent-entites-cool").value = cur;
}

window.intents = window.intents || {},
function(n) {
    intents.messaging = {
      SendCurrentIntent: function(eventName, new_input=true) {
        let intentName = document.getElementById("intent-name").value;
        let intentExamples = document.getElementById("intent-examples").value;
        let intentEntites = document.getElementById("intent-entites").value;
        let args = {intentName, intentExamples, intentEntites, new_input};
        ipcRenderer.send(eventName, args);
      },

      getTextSelection: function(){
        var field = document.getElementById("intent-examples");
        var startPos = field.selectionStart;
        var endPos = field.selectionEnd;
        var field_value = field.value;
        var selectedText = field_value.substring(startPos,endPos);

        //check only all selection in one line
        selectedTextLines = selectedText.split("\n");
        if(selectedTextLines.length != 1) {
          return;
        }

        //break text to lines
        var lines = field_value.split("\n");
        var sumToFar = 0;
        var line = -1;
        for(i=0; i<lines.length; i++) {
          if(startPos >= sumToFar && endPos <= sumToFar+lines[i].length) {
            line = i;
            break;
          }
          sumToFar += lines[i].length + 1;
        }
        var realStart = startPos - sumToFar;
        var realEnd = endPos - sumToFar;

        //set them to the user
        document.getElementById("intent-entity-from").value = realStart;
        document.getElementById("intent-entity-to").value = realEnd;
        document.getElementById("intent-entity-idx").value = line;
        if (realStart >= 0 && realEnd <= lines[line].length) {
          document.getElementById("entity-selected-text").innerHTML = lines[line].substr(realStart, realEnd-realStart+1);
        }
      },

      addIntentEntity: function() {
        let attr = [];
        if(document.getElementById("intent-entity-from").value ==
          document.getElementById("intent-entity-to").value) {
          return;
        }
        attr.push(document.getElementById("intent-entity-from").value);
        attr.push(document.getElementById("intent-entity-to").value);
        attr.push(document.getElementById("intent-entity-idx").value);
        attr.push(document.getElementById("intent-examples").value.split('\n')[parseInt(document.getElementById("intent-entity-idx").value)].substring(parseInt(attr[0]), parseInt(attr[1])));
        attr.push(document.getElementById("intent-entity-name").value);

        let text = attr.join('\t') + '\n';
        let cur = document.getElementById("intent-entites").value;
        cur += text;
        document.getElementById("intent-entites").value = cur;
        add_to_cool(attr[3], attr[4])
      },

      removeIntentEntity: function(str) {
        let cur = document.getElementById(str).value.split('\n');
        if (cur[cur.length - 1] == '')
          cur.pop();
        cur.pop();
        document.getElementById(str).value = cur.join('\n') + '\n';
      },

      addIntent: function(new_input=true) {
        intents.messaging.SendCurrentIntent('add-intent', new_input);
      },

      validateCurrentIntent: function(new_input=true) {
        intents.messaging.SendCurrentIntent('validate-curr-intent', new_input);
      },

      UpdateTable: function() {
        ipcRenderer.send('get-intents');
      },

      init: function() {
        $('#add-intent-entity').click( function () {
          intents.messaging.addIntentEntity()
        })
        $('#remove-intent-entity').click( function () {
          intents.messaging.removeIntentEntity("intent-entites")
          intents.messaging.removeIntentEntity("intent-entites-cool")
        })
        $('#intent-examples').click( function () {
          intents.messaging.getTextSelection()
        })
        $('#intent-examples').mousemove( function () {
          intents.messaging.getTextSelection()
        })
        $('#add-intent').click( function () {
          intents.messaging.addIntent()
        })
        $('#update-intent').click( function () {
          intents.messaging.addIntent(new_input=false)
        })
        $('#validate-curr-intent').click( function () {
          intents.messaging.validateCurrentIntent()
        })
        $('#validate-update-intent').click( function () {
          intents.messaging.validateCurrentIntent(new_input=false)
        })
        $('#cancel-intent').click( function () {
          reset_ui();
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
        cell.innerHTML = " <b></b>";
        cell = row.insertCell(1);
        cell.innerHTML = " <b></b>";
        cell = row.insertCell(2);
        cell.innerHTML = " <b></b>";
      },

      handleEntites: function(data) {
        text = '';
        for (let i = 0; i < data.length; ++i) {
          text += data[i].from + '\t' + data[i].to + '\t' + data[i].value + '\t' + data[i].name + '<br />';
        }
        return text;
      },

      addRow: function(tableRef, data) {
        // add new row
        let newRow = tableRef.insertRow(-1);
        // intent name
        let newCell1 = newRow.insertCell(-1);
        newCell1.innerHTML = data.name;
        // update key
        let newCellx = newRow.insertCell(-1);
        let elementx = document.createElement("input");
        elementx.value = "View/Modify";
        elementx.className = "button submit";
        elementx.type = "input";
        elementx.onclick = function() {
          // delete old one
          // intents.handler.remove(data.name);
          // intent name
          document.getElementById("intent-name").value = data.name;
          document.getElementById("intent-name").disabled = true;
          //display new buttons
          document.getElementById("intents-normal-buttons").style.display = 'none';
          document.getElementById("intents-update-buttons").style.display = 'block';
           // handle examples
          let examples_ = ""
          for(let i =0; i<data.examples.length; i++) {
           examples_ += data.examples[i] + '\n';
          }
          // handle entities
          let entities_ = ""
          for(let i =0; i<data.entites.length; i++) {
           entities_ += data.entites[i].from.toString() + '\t';
           entities_ += data.entites[i].to.toString() + '\t';
           entities_ += data.entites[i].index.toString() + '\t';
           entities_ += data.entites[i].value.toString() + '\t';
           entities_ += data.entites[i].name + '\t';
           entities_ += '\n';
           add_to_cool(data.entites[i].value.toString(), data.entites[i].name)
          }
          // set them
          document.getElementById("intent-examples").value = examples_;
          document.getElementById("intent-entites").value = entities_;
          // alert
          // document.getElementById("intent-warning").innerHTML = 'This Intent was deleted in order for you to modify it, make sure to re-insert it again if you still need it!';
          //swap up
          jQuery('html,body').animate({scrollTop:0},0);
        };
        newCellx.appendChild(elementx);
        // let newCell3 = newRow.insertCell(-1);
        // newCell3.innerHTML += intents.handler.handleEntites(data.entites);
        // delete key
        let newCell4 = newRow.insertCell(-1);
        let element = document.createElement("input");
        element.value = "Delete";
        element.className = "button submit";
        element.type = "input";
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
