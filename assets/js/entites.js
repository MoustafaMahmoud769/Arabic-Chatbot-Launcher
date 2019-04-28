const { ipcRenderer } = require('electron')

window.entites = window.entites || {},
function(n) {

    entites.messaging = {
      SendCurrentEntity: function(eventName) {
        let entityName = document.getElementById("entity").value
        let entityExamples = document.getElementById("entity-examples").value
        let args = {entityName, entityExamples}
        ipcRenderer.send(eventName, args)
      },

      addEntity: function() {
        entites.messaging.SendCurrentEntity('add-entity');
      },

      loadEntity: function() {
        ipcRenderer.send('load-entity', 'an-argument')
      },

      validateCurrentEntity: function() {
        entites.messaging.SendCurrentEntity('validate-curr-entity');
      },

      init: function() {
        $('#add-entity').click( function () {
          entites.messaging.addEntity();
        })

        $('#load-entity').click( function () {
          entites.messaging.loadEntity()
        })

        $('#validate-curr-entity').click( function () {
          entites.messaging.validateCurrentEntity()
        })
      }
    };

    n(function() {
        entites.messaging.init();
    })

}(jQuery);