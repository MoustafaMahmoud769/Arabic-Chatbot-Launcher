const { ipcRenderer } = require('electron')

window.story = window.story || {},
function(n) {
    story.messaging = {

      SendCurrentStory: function(eventName) {
        let storyName = document.getElementById("story-name").value
        let storyBody = document.getElementById("story-body").value
        let args = {storyName, storyBody}
        ipcRenderer.send(eventName, args)
      },

      addStory: function() {
        story.messaging.SendCurrentStory('add-story');
      },

      loadStory: function() {
        ipcRenderer.send('load-story', 'an-argument')
      },
      
      validateCurrentStory: function() {
        story.messaging.SendCurrentStory('validate-curr-story');
      },

      init: function() {
        $('#add-story').click( function () {
          story.messaging.addStory()
        })

        $('#load-story').click( function () {
          story.messaging.loadStory()
        })

        $('#validate-curr-story').click( function () {
          story.messaging.validateCurrentStory()
        })
      }
    };

    n(function() {
        story.messaging.init();
    })

}(jQuery);
