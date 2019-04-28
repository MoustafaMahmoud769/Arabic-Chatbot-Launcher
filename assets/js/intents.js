const { ipcRenderer } = require('electron')

window.intents = window.intents || {},
function(n) {
    intents.messaging = {

      SendCurrentIntent: function(eventName) {
        let intentName = document.getElementById("intent-name").value
        let intentExamples = document.getElementById("intent-examples").value
        let args = {intentName, intentExamples}
        ipcRenderer.send(eventName, args)
      },

      addIntent: function() {
        intents.messaging.SendCurrentIntent('add-intent');
      },

      loadIntent: function() {
        ipcRenderer.send('load-intent', 'an-argument')
      },

      validateCurrentIntent: function() {
        intents.messaging.SendCurrentIntent('validate-curr-intent');
      },


      init: function() {
        $('#add-intent').click( function () {
          intents.messaging.addIntent()
        })

        $('#load-intent').click( function () {
          intents.messaging.loadIntent()
        })
        $('#validate-curr-intent').click( function () {
          intents.messaging.validateCurrentIntent()
        })
      }
    };

    n(function() {
        intents.messaging.init();
    })

}(jQuery);
