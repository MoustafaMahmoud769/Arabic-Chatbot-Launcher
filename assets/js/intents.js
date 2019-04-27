const { ipcRenderer } = require('electron')

window.intents = window.intents || {},
function(n) {
    intents.messaging = {

      addIntent: function() {
        let intentName = document.getElementById("intent-name").value
        let intentExamples = document.getElementById("intent-examples").value
        let args = {intentName, intentExamples}
        ipcRenderer.send('add-intent', args)
      },

      loadIntent: function() {
        ipcRenderer.send('load-intent', 'an-argument')
      },

      init: function() {
        $('#add-intent').click( function () {
          intents.messaging.addIntent()
        })

        $('#load-intent').click( function () {
          intents.messaging.loadIntent()
        })

      }
    };

    n(function() {
        intents.messaging.init();
    })

}(jQuery);
