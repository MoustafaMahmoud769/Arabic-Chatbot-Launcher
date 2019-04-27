const { ipcRenderer } = require('electron')

window.actions = window.actions || {},
function(n) {
    actions.messaging = {

      addAction: function() {
        ipcRenderer.send('add-action', 'an-argument')
      },

      loadAction: function() {
        ipcRenderer.send('load-action', 'an-argument')
      },

      init: function() {
        $('#add-action').click( function () {
          actions.messaging.addAction()
        })

        $('#load-action').click( function () {
          actions.messaging.loadAction()
        })

      }
    };

    n(function() {
        actions.messaging.init();
    })

}(jQuery);
