const { ipcRenderer } = require('electron')

window.actions = window.actions || {},
function(n) {
    actions.messaging = {

      addAction: function() {
        let actionName = document.getElementById("action-name").value
        let actionExamples = document.getElementById("action-examples").value
        let args = {actionName, actionExamples}
        ipcRenderer.send('add-action', args)
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
