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

      startExampleModel: function() {
        ipcRenderer.send('start-example-model', null);
      },

      stopExampleModel: function() {
        ipcRenderer.send('stop-example-model', null);
      },

      addMessage: function() {
        let ul = document.getElementById('chat-content');
        let li = document.createElement("LI");
        li.className = "right clearfix";
        let span = document.createElement("SPAN");
        span.className = "chat-img pull-right";
        let img = document.createElement("IMG");
        img.src = "./asset/icons/human.png";
        img.alt = "None";
        img.width = "70px";
        img.height = "60px";
        img.style = "img-circle";
        span.appendChild(img);
        li.appendChild(span);
        let divChat = document.createElement("DIV");
        divChat.className = "chat-body clearfix";
        let divHead = document.createElement("DIV");
        divHead.className = "header";
        let strong = document.createElement("STRONG");
        strong.className = "pull-right primary-font";
        strong.innerHTML = 'أنت';
        divHead.appendChild(strong);
        divChat.appendChild(divHead);
        let p = document.createElement("P");
        p.innerHTML = document.getElementById("msg-body").value;
        divChat.appendChild(p);
        li.appendChild(divChat);
        ul.appendChild(li);
        launch.messaging.sendMessage(document.getElementById("msg-body").value);
        document.getElementById("msg-body").value = '';
      },

      sendMessage: function(msg) {
        console.log(msg);
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
        // $.post( "localhost:5002/webhooks/rest/webhook", { "message": msg, "sender": "User" }, function( data ) {
        //   console.log(data);
        //   for (let i = 0; i < data.length; ++i) {
        //     launch.messaging.addReply(data[i].text);
        //   }
        // }, "json");
      },

      addReply: function(reply) {
        let ul = document.getElementById('chat-content');
        let li = document.createElement("LI");
        li.className = "left clearfix";
        let span = document.createElement("SPAN");
        span.className = "chat-img pull-left";
        let img = document.createElement("IMG");
        img.src = "None";
        img.alt = "None";
        img.width = "70px";
        img.height = "60px";
        img.style = "img-circle";
        span.appendChild(img);
        li.appendChild(span);
        let divChat = document.createElement("DIV");
        divChat.className = "chat-body clearfix";
        let divHead = document.createElement("DIV");
        divHead.className = "header";
        let strong = document.createElement("STRONG");
        strong.className = "pull-left primary-font";
        strong.innerHTML = 'فراسة';
        divHead.appendChild(strong);
        divChat.appendChild(divHead);
        let p = document.createElement("P");
        p.innerHTML = reply;
        divChat.appendChild(p);
        li.appendChild(divChat);
        ul.appendChild(li);
      },

      init: function() {
        $('#validate-my-model').click( function () {
          launch.messaging.validateMyModel()
        })

        $('#launch-my-model').click( function () {
          launch.messaging.launchMyModel()
        })

        $('#start-example-model').click( function () {
          launch.messaging.startExampleModel()
        })

        $('#stop-example-model').click( function () {
          launch.messaging.stopExampleModel()
        })

        $('#btn-chat').click( function() {
          launch.messaging.addMessage()
        })

      }
    };

    launch.handler = {


      init: function() {
      }
    };

    n(function() {
        launch.messaging.init();
        launch.handler.init();
    })

}(jQuery);
