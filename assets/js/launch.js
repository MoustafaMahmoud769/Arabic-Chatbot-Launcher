const { ipcRenderer } = require('electron')

window.launch = window.launch || {},
function(n) {
    launch.messaging = {

      validateMyModel: function() {
        ipcRenderer.send('validate-my-model', 'an-argument')
      },

      launchMyModel: function() {
        ipcRenderer.send('launch-my-model', 'an-argument')
      },

      launchExampleModel: function() {
        ipcRenderer.send('launch-example-model', 'an-argument')
      },

      init: function() {
        $('#validate-my-model').click( function () {
          launch.messaging.addIntent()
        })

        $('#launch-my-model').click( function () {
          launch.messaging.loadIntent()
        })

        $('#launch-example-model').click( function () {
          launch.messaging.loadIntent()
        })

      }
    };

    n(function() {
        launch.messaging.init();
    })

}(jQuery);
