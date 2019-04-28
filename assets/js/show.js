const { ipcRenderer } = require('electron')

window.show = window.show || {},
function(n) {
    show.messaging = {

      getData: function() {
        //TODO: add all content here
        // 1- get selected topic to display
        // 2- call smth to get obj data
        // 3- parse obj as single string and call line 16
        text = ""
        for (var i = 0; i < 50; i++) {
          text += "a\n"
        }
        document.getElementById("show-data").value = text
      },

      init: function() {
        $('#show-content').click( function () {
          show.messaging.getData()
        })
      }
    };

    n(function() {
        show.messaging.init();
    })

}(jQuery);
