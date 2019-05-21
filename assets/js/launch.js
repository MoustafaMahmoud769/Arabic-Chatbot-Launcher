const { ipcRenderer } = require('electron')

ipcRenderer.on('model-validated', (event, arg)=> {
  launch.handler.logValidation(arg);
})

window.launch = window.launch || {},
function(n) {
    launch.messaging = {

      validateMyModel: function() {
        ipcRenderer.send('validate-my-model', null)
      },

      startMyModel: function() {
        ipcRenderer.send('start-my-model', null)
      },

      buildMyModel: function() {
        ipcRenderer.send('build-my-model', null)
      },

      stopMyModel: function() {
        ipcRenderer.send('stop-my-model', null)
      },

      startExampleModel: function() {
        ipcRenderer.send('start-example-model', null);
      },

      stopExampleModel: function() {
        ipcRenderer.send('stop-example-model', null);
      },

      getTime: function() {
        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        return date + ' ' + time;
      },

      addMessage: function() {
        if (document.getElementById('msg-body').value.trim() === '')
          return;
        text = document.getElementById('msgs-container').innerHTML;
        newMsg = '<div class="outgoing_msg"><div class="sent_msg"><p>';
        newMsg += document.getElementById('msg-body').value;
        newMsg += '</p><span class="time_date">';
        newMsg += launch.messaging.getTime();
        newMsg += '</span> </div></div>'
        text += newMsg;
        document.getElementById('msgs-container').innerHTML = text;
        launch.messaging.sendMessage(document.getElementById('msg-body').value);
        document.getElementById('msg-body').value = '';
      },

      sendMessage: function(msg) {
        $.ajax({
            url: 'http://localhost:5002/webhooks/rest/webhook',
            dataType: 'json',
            type: 'post',
            contentType: 'application/json',
            data: '{ "message": "' + msg + '", "sender": "User" }',
            processData: false,
            async: false
        }).done(function (data, textStatus, jQxhr) {
            console.log("Done");
            for (let i = 0; i < data.length; ++i) {
              launch.messaging.addReply(data[i].text);
            }
        }).fail(function (jqXhr, textStatus, errorThrown) {
            console.log(errorThrown);
        });
      },

      addReply: function(reply) {
        text = document.getElementById('msgs-container').innerHTML;
        newMsg = '<div class="incoming_msg"><div class="incoming_msg_img"> <img src="assets/icons/bot.png" alt="Image Not Found !"> </div><div class="received_msg"><div class="received_withd_msg"><p>';
        newMsg += reply;
        newMsg += '</p><span class="time_date">';
        newMsg += launch.messaging.getTime();
        newMsg += '</span></div></div></div>';
        text += newMsg;
        document.getElementById('msgs-container').innerHTML = text;
      },

      init: function() {
        $('#validate-my-model').click( function () {
          launch.messaging.validateMyModel()
        })

        $('#start-my-model').click( function () {
          launch.messaging.startMyModel()
        })

        $('#build-my-model').click( function () {
          launch.messaging.buildMyModel()
        })

        $('#stop-my-model').click( function () {
          launch.messaging.stopMyModel()
        })

        $('#start-example-model').click( function () {
          launch.messaging.startExampleModel()
        })

        $('#stop-example-model').click( function () {
          launch.messaging.stopExampleModel()
        })

        $('#btn-chat').click( function() {
          launch.messaging.addMessage('sasa')
        })

      }
    };

    launch.handler = {

      logValidation: function(data) {
        text = '';
        for (let i = 0; i < data.length; ++i) {
          text += '<h5>' + data[i].title + '<h5><br/>';
          text += '<h6>' + data[i].body + '<h6><br/>';
        }
        document.getElementById('model-validation').innerHTML = text;
      },

      init: function() {

      }
    };

    n(function() {
        launch.messaging.init();
        launch.handler.init();
    })

}(jQuery);
