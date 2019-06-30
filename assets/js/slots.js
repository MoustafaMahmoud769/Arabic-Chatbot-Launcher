const { ipcRenderer } = require('electron')

function display_slot_options() {
	var e = document.getElementById("slot-type");
	var choosed_slot = e.options[e.selectedIndex].value;
	// hide all
	document.getElementById("slot-text").style.display = 'none';
	document.getElementById("slot-categorical").style.display = 'none';
	document.getElementById("slot-bool").style.display = 'none';
	document.getElementById("slot-float").style.display = 'none';
	document.getElementById("slot-list").style.display = 'none';
	document.getElementById("slot-unfeaturized").style.display = 'none';
	// display only the chosen one
	document.getElementById("slot-" + choosed_slot).style.display = 'block';
}

function reset_ui() {
  document.getElementById("slot-warning").innerHTML = '';
  document.getElementById("slot-name").value = '';
  document.getElementById("float-minimum").value = '';
  document.getElementById("float-maximum").value = '';
  document.getElementById("categories-list").value = '';
  // account for update
  document.getElementById("slots-normal-buttons").style.display = 'block';
  document.getElementById("slots-update-buttons").style.display = 'none'; 
  // enable the title textarea
  document.getElementById("slot-name").disabled = false; 
}

ipcRenderer.on('slot-added', (event, arg)=> {
  reset_ui();
})

ipcRenderer.on('send-slots', (event, arg)=> {
  slots.handler.update(arg);
})

ipcRenderer.on('slots-changed', (event, arg)=> {
  slots.messaging.UpdateTable();
})

window.slots = window.slots || {},
function(n) {
    slots.messaging = {

      SendCurrentSlot: function(eventName, new_input=true) {
        let slotName = document.getElementById("slot-name").value;
    		let e = document.getElementById("slot-type");
        let slotType = e.options[e.selectedIndex].value;
        let floatMin = document.getElementById("float-minimum").value;
        let floatMax = document.getElementById("float-maximum").value;
        let catList = document.getElementById("categories-list").value;
        let args = {slotName, slotType, floatMin, floatMax, catList, new_input};
        ipcRenderer.send(eventName, args);
      },

      addSlot: function(new_input=true) {
        slots.messaging.SendCurrentSlot('add-slot', new_input);
      },

      validateCurrentSlot: function(new_input=true) {
        slots.messaging.SendCurrentSlot('validate-curr-slot', new_input);
      },

      UpdateTable: function() {
        ipcRenderer.send('get-slots');
      },

      init: function() {
        $('#add-slot').click( function () {
          slots.messaging.addSlot()
        })
        $('#update-slot').click( function () {
          slots.messaging.addSlot(new_input=false)
        })
        $('#validate-curr-slot').click( function () {
          slots.messaging.validateCurrentSlot()
        })
        $('#validate-update-slot').click( function () {
          slots.messaging.validateCurrentSlot(new_input=false)
        })
        $('#cancel-slot').click( function () {
          reset_ui();
        })
        $('#tab6').click( function() {
          slots.messaging.UpdateTable()
        })
      }

    };


    slots.handler = {

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
        // slot name
        let newCell1 = newRow.insertCell(-1);
        newCell1.innerHTML = data.name
        // update key
        let newCell4 = newRow.insertCell(-1);
        let element4 = document.createElement("input");
        element4.value = "Display/Modify";
        element4.className = "button submit";
        element4.type = "input";
        element4.onclick = function() {
          // delete old
          // slots.handler.remove(data.name);
          // set data
          document.getElementById("slot-name").value = data.name;
          document.getElementById("slot-name").disabled = true;
          document.getElementById("slot-type").value = data.type;
          document.getElementById("float-minimum").value = data.fmin;
          document.getElementById("float-maximum").value = data.fmax;
          // clist
          let clist_ = ""
          for(let i =0; i<data.clist.length; i++) {
           clist_ += data.clist[i] + '\n';
          }
          document.getElementById("categories-list").value = clist_;
          //display new buttons
          document.getElementById("slots-normal-buttons").style.display = 'none';
          document.getElementById("slots-update-buttons").style.display = 'block';
          // alert
          // document.getElementById("slot-warning").innerHTML = 'This Slot was deleted in order for you to modify it, make sure to re-insert it again if you still need it!';
          display_slot_options();
          //swap up
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
          slots.handler.remove(data.name);
        };
        newCell5.appendChild(element5);
      },

      remove: function(name) {
        ipcRenderer.send('remove-slot', name);
      },

      update: function(data) {
        let tableRef = document.getElementById('show-slots');
        slots.handler.addHeader(tableRef);
        for(let i = 0; i < data.length; i++){
          slots.handler.addRow(tableRef, data[i]);
        }
      },

      init: function() {

      }
    };


    n(function() {
        slots.messaging.init();
        slots.handler.init();
    })

}(jQuery);
