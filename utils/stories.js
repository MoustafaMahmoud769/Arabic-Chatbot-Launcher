const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')
var slotsObj = require('./slots')

var tools = require('./tools')

const path = 'assets/botFiles/stories.json';
var storiesValitdatorObj = require('./stories_validator')

function cleanStory(storyObj) {
  storyObj.name = tools.strip(storyObj.name);
  for(i = 0; i < storyObj.examples.length; i++) {
    storyObj.examples[i] = tools.strip(storyObj.examples[i]);
  }
  storyObj.examples = storyObj.examples.filter(Boolean);
  return storyObj;
}

function get_slot_data(str) {
  return storiesValitdatorObj.get_slot_data(str);
}

function validateSingleStory(story) {
  return storiesValitdatorObj.validateSingleStory(story);
}

function findStoryError(validation_results, options) {
  return storiesValitdatorObj.findStoryError(validation_results, options);
}

function isStoryValidwAction(story) {
  let validation_results = validateSingleStory(story);
  let error = findStoryError(validation_results, {"dups": story.new_input});

  if(error == false) {
    return true;
  }

  dialog.showErrorBox(error['title'], error['body']);
  return false;
}

function remove_story_fn(event, arg) {
  let data = JSON.parse(fs.readFileSync(path));
  let edited = [];
  for (let i = 0; i < data.length; ++i) {
    if (data[i].name == arg)
      continue;
    edited.push(data[i]);
  }
  fs.writeFileSync(path, JSON.stringify(edited, null, 2));
  event.sender.send('stories-changed');
}

ipcMain.on('validate-curr-story', (event, arg)=>{

  //get current story from front end
  var story = {
    name: arg.storyName,
    examples: arg.storyBody.split('\n'),
    new_input: arg.new_input
  };
  story = cleanStory(story);

  if(!isStoryValidwAction(story)) {
    return;
  }

  dialog.showMessageBox({
    type: 'info',
    message: 'This is a valid story!',
    buttons: ['Ok']
  });

})

ipcMain.on('add-story', (event, arg)=> {
  var story = {
    name: arg.storyName,
    examples: arg.storyBody.split('\n'),
    new_input: arg.new_input
  };
  story = cleanStory(story);

  if(!isStoryValidwAction(story)) {
    return;
  }

  story = {
    name: story.name,
    examples: story.examples
  };

  remove_story_fn(event, story.name);

  let stories = JSON.parse(fs.readFileSync(path));
  stories.push(story);
  fs.writeFileSync(path, JSON.stringify(stories, null, 2));
  event.sender.send('stories-changed');
  event.sender.send('story-added');
})

ipcMain.on('load-story', (event, arg)=> {
  let results = [];
  var set = new Set();
  let data = JSON.parse(fs.readFileSync(path));
  for (let i = 0; i < data.length; i++)
    set.add(data[i].name);
  var added = 0;
  fs.createReadStream(arg)
    .pipe(csv(['name', 'examples']))
    .on('data', (data) => results.push(data))
    .on('end', () => {
      for (let i = 0; i < results.length; i++) {
        row = results[i];
        if (row.hasOwnProperty('name') && !set.has(row.name)) {
          var newRow = { name: row.name, examples: row.examples.split('\n') };
          data.push(newRow);
          added++;
        }
        set.add(row.name);
      }
      fs.writeFile(path, JSON.stringify(data, null, 2), (err) => {
        if (err) {
          dialog.showErrorBox('Oops.. ', 'Something went wrong');
          return;
        }
        dialog.showMessageBox({
          type: 'info',
          message: 'Loaded Successfully',
          detail: 'Added ' + added.toString(10) + ' Stories.',
          buttons: ['Ok']
        });
        event.sender.send('stories-changed');
      });
    });
})

ipcMain.on('get-stories', (event, arg)=> {
  let data = JSON.parse(fs.readFileSync(path));
  event.sender.send('send-stories', data);
})

ipcMain.on('remove-story', (event, arg)=> {
  remove_story_fn(event, arg);
})

module.exports = {
    validateSingleStory: validateSingleStory,
    findStoryError: findStoryError,
    get_slot_data: get_slot_data,
}
