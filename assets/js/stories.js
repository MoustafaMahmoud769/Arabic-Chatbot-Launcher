const { ipcRenderer } = require('electron')
const csv = require('csv-parser')
const fs = require('fs')

ipcRenderer.on('open-dialog-paths-selected-story', (event, arg)=> {
  story.handler.outputSelectedPathsFromOpenDialog(arg);
})

window.story = window.story || {},
function(n) {
    story.messaging = {

      SendCurrentStory: function(eventName) {
        let storyName = document.getElementById("story-name").value;
        let storyBody = document.getElementById("story-body").value;
        let args = {storyName, storyBody};
        ipcRenderer.send(eventName, args);
        document.getElementById("story-name").value = '';
        document.getElementById("story-body").value = '';
      },

      addStory: function() {
        story.messaging.SendCurrentStory('add-story');
      },

      validateCurrentStory: function() {
        story.messaging.SendCurrentStory('validate-curr-story');
      },

      setOptions: function(optionName, data) {
        var sel = document.getElementById(optionName);
        sel.innerHTML = '';
        if (data.length !== 0) {
          for (let i = 0; i < data.length; i++) {
            var opt = document.createElement('option');
            opt.appendChild(document.createTextNode(data[i].name) );
            opt.value = data[i].name;
            sel.appendChild(opt);
          }
        }
        else {
          var opt = document.createElement('option');
          opt.appendChild(document.createTextNode('None') );
          opt.value = '';
          sel.appendChild(opt);
        }
      },

      addChoices: function() {
        var loc = window.location.pathname;
        var dir = loc.substring(0, loc.lastIndexOf('/')) + '/assets/botFiles/';
        let rawdata = fs.readFileSync(dir + 'intents.json');
        let data = JSON.parse(rawdata);
        story.messaging.setOptions('intents-list', data);
        rawdata = fs.readFileSync(dir + 'actions.json');
        data = JSON.parse(rawdata);
        story.messaging.setOptions('actions-list', data);
      },

      appendIntent: function() {
        selected = '* ' + document.getElementById('intents-list').value + '\n';
        text = document.getElementById('story-body').value + selected;
        console.log(text);
        document.getElementById('story-body').value = text;
      },

      appendAction: function() {
        selected = '- ' + document.getElementById('actions-list').value + '\n';
        text = document.getElementById('story-body').value + selected;
        console.log(text);
        document.getElementById('story-body').value = text;
      },

      init: function() {
        $('#add-story').click( function () {
          story.messaging.addStory()
        })

        $('#validate-curr-story').click( function () {
          story.messaging.validateCurrentStory()
        })
        $('#tab5').click( function() {
          story.messaging.addChoices()
        })

        $('#intents-list').click( function() {
          story.messaging.appendIntent()
        })

        $('#actions-list').click( function() {
          story.messaging.appendAction()
        })

      }
    };

    story.handler = {

      loadStory: function() {
        ipcRenderer.send('show-open-dialog-story');
      },

      outputSelectedPathsFromOpenDialog: function(paths) {
        if (!paths)
          return;
        let results = [];
        var set = new Set();
        var loc = window.location.pathname;
        var dir = loc.substring(0, loc.lastIndexOf('/')) + '/assets/botFiles/stories.json';
        let rawdata = fs.readFileSync(dir);
        let data = JSON.parse(rawdata);
        for (let i = 0; i < data.length; i++)
          set.add(data[i].name);
        fs.createReadStream(paths[0])
          .pipe(csv(['name', 'examples']))
          .on('data', (data) => results.push(data))
          .on('end', () => {
            for (let i = 0; i < results.length; i++) {
              row = results[i];
              if (row.hasOwnProperty('name') && row.hasOwnProperty('examples') && !set.has(row.name)) {
                let newRow = { name: row.name, examples: row.examples.split('\n') };
                data.push(newRow);
              }
              set.add(row.name);
            }
            fs.writeFile('assets/botFiles/stories.json', JSON.stringify(data, null, 2), (err) => {
              if (err)
                throw err;
            });
          });
      },

      init: function() {
        $('#load-story').click( function () {
          story.handler.loadStory()
        })
      }
    };

    n(function() {
        story.messaging.init();
        story.handler.init();
    })
}(jQuery);
