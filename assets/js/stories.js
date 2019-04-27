const { ipcRenderer } = require('electron')

window.story = window.story || {},
function(n) {
    story.messaging = {

      addStory: function() {
        let storyName = document.getElementById("story-name").value
        let storyBody = document.getElementById("story-body").value
        let args = {storyName, storyBody}
        ipcRenderer.send('add-story', args)
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
