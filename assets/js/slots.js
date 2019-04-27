const { ipcRenderer } = require('electron')

window.slots = window.slots || {},
function(n) {
    slots.messaging = {

      init: function() {

      }
    };

    n(function() {
        slots.messaging.init();
    })

}(jQuery);
