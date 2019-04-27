const { ipcRenderer } = require('electron')

window.entites = window.entites || {},
function(n) {
    entites.messaging = {

      addEntity: function() {
        ipcRenderer.send('add-entity', 'an-argument')
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
