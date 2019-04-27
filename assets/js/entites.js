const { ipcRenderer } = require('electron')

window.entites = window.entites || {},
function(n) {
    entites.messaging = {

      addEntity: function() {
        let actionName = document.getElementById("entity").value
        let actionExamples = document.getElementById("entity-examples").value
        let args = {actionName, actionExamples}
        ipcRenderer.send('add-entity', args)
      },

      loadEntity: function() {
        ipcRenderer.send('load-entity', 'an-argument')
      },

      init: function() {
        $('#add-entity').click( function () {
          entites.messaging.addEntity()
        })

        $('#load-entity').click( function () {
          entites.messaging.loadEntity()
        })

      }
    };

    n(function() {
        entites.messaging.init();
    })

}(jQuery);
