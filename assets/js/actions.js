const { ipcRenderer } = require('electron')

window.actions = window.actions || {},
function(n) {
    actions.messaging = {

      SendCurrentAction: function(eventName) {
        let actionName = document.getElementById("action-name").value;
        let actionExamples = document.getElementById("action-examples").value;
        let args = {actionName, actionExamples};
        ipcRenderer.send(eventName, args);
        document.getElementById("action-name").value = '';
        document.getElementById("action-examples").value = '';
      },

      addAction: function() {
        actions.messaging.SendCurrentAction('add-action');
      },

      loadAction: function() {
        ipcRenderer.send('load-action', 'an-argument');
      },

      validateCurrentAction: function() {
        actions.messaging.SendCurrentAction('validate-curr-action');
      },

      init: function() {
        $('#add-action').click( function () {
          actions.messaging.addAction()
        })

        $('#load-action').click( function () {
          actions.messaging.loadAction()
        })

        $('#validate-curr-action').click( function () {
          actions.messaging.validateCurrentAction()
        })
      }
    };

    n(function() {
        actions.messaging.init();
    })

}(jQuery);
