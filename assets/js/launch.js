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

      addMessage: function() {
        let ul = document.getElementById('chat-content');
        let li = document.createElement("LI");
        li.className = "right clearfix";
        let span = document.createElement("SPAN");
        span.className = "chat-img pull-right";
        let img = document.createElement("IMG");
        // img.src = "./asset/icons/human.png";
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
        document.getElementById("msg-body").value = '';
      },

      addReply: function() {
        let ul = document.getElementById('chat-content');
        let li = document.createElement("LI");
        li.className = "left clearfix";
        let span = document.createElement("SPAN");
        span.className = "chat-img pull-left";
        let img = document.createElement("IMG");
        img.src = "";
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
        p.innerHTML = 'ﻻ';
        divChat.appendChild(p);
        li.appendChild(divChat);
        ul.appendChild(li);
      },

      sendMessage: function() {
      },

      init: function() {
        $('#validate-my-model').click( function () {
          launch.messaging.validateMyModel()
        })

        $('#launch-my-model').click( function () {
          launch.messaging.launchMyModel()
        })

        $('#launch-example-model').click( function () {
          launch.messaging.launchExampleModel()
        })

        $('#btn-chat').click( function() {
          launch.messaging.addMessage()
          launch.messaging.sendMessage()
          launch.messaging.addReply()
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
