const { ipcRenderer } = require('electron')

window.story = window.story || {},
function(n) {
    story.messaging = {

      addStory: function() {
        ipcRenderer.send('add-story', 'an-argument')
      },

      loadStory: function() {
        ipcRenderer.send('load-story', 'an-argument')
      },

      init: function() {
        $('#add-story').click( function () {
          story.messaging.addStory()
        })

        $('#load-story').click( function () {
          story.messaging.loadStory()
        })

      }
    };

    n(function() {
        story.messaging.init();
    })

}(jQuery);
