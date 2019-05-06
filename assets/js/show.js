const { ipcRenderer } = require('electron')
var fs = require('fs')

window.show = window.show || {},
function(n) {
    show.messaging = {

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
        details = data.examples.join('\n');
        let newCell2 = newRow.insertCell(-1);
        let newText2 = document.createTextNode(details);
        newCell2.appendChild(newText2);
        let newCell3 = newRow.insertCell(-1);
        let element = document.createElement("input");
        element.name = "Delete";
        element.type = "input";
        element.value = "Delete";
        element.onclick = function() {
          show.messaging.remove(data.name);
        };
        newCell3.appendChild(element);
      },

      remove: function(name) {
        var loc = window.location.pathname;
        var dir = loc.substring(0, loc.lastIndexOf('/')) + '/assets/botFiles/';
        selected = document.getElementById("show-content").value.toLowerCase() + '.json';
        let rawdata = fs.readFileSync(dir + selected);
        let data = JSON.parse(rawdata);
        data = data.filter(function(ele){
                   return ele.name != name;
               });
         fs.writeFile(dir + selected, JSON.stringify(data, null, 2), (err) => {
           if (err)
             throw err;
         });
      },

      getData: function() {
        var loc = window.location.pathname;
        var dir = loc.substring(0, loc.lastIndexOf('/')) + '/assets/botFiles/';
        selected = document.getElementById("show-content").value.toLowerCase();
        let tableRef = document.getElementById('show-data');
        show.messaging.addHeader(tableRef);
        if (selected === 'none') {
          return;
        }
        selected += '.json';
        let rawdata = fs.readFileSync(dir + selected);
        let data = JSON.parse(rawdata);
        for(let i = 0; i < data.length; i++){
          show.messaging.addRow(tableRef, data[i]);
        }
      },

      init: function() {
        $('#show-content').click( function () {
          show.messaging.getData()
        })
      }
    };

    n(function() {
        show.messaging.init();
    })

}(jQuery);
