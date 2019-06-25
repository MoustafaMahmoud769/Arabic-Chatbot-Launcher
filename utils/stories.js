const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')

var tools = require('./tools')

const path = 'assets/botFiles/stories.json';

function cleanStory(storyObj) {
  storyObj.name = tools.strip(storyObj.name);
  for(i = 0; i < storyObj.examples.length; i++) {
    storyObj.examples[i] = tools.strip(storyObj.examples[i]);
  }
  storyObj.examples = storyObj.examples.filter(Boolean);
  return storyObj;
}

function validateSingleStory(story) {
  /**
   * check if name or examples are empty!
   */
   let empty = false;
   if(story.name == '' ||
      story.examples.length == 0) {
    empty = true;
   }

  /**
   * check for invalid line in story body
   */
   let invalid = false;
   let invalid_str = "";
   for(let i=0; i<story.examples.length; i++) {
      if(story.examples[i][0] != '*' &&
         story.examples[i][0] != '-') {
        invalid_str = story.examples[i];
        invalid = true;
        break;
      }
   }

  /**
   * check for no_action
   */
   let no_action = false;
   let no_action_str = "";
   let curr_story = [];
   for(let i=0; i<story.examples.length; i++) {
      // intent
      if(story.examples[i][0] == '*') {
        if(curr_story.length == 1) {
          no_action = true;
          no_action_str = curr_story[0];
          break;
        }
        curr_story = []
        curr_story.push(story.examples[i])
      }
      // action
      if(story.examples[i][0] == '-' && curr_story.length > 0) {
        curr_story.push(story.examples[i])
      }
   }
   if(curr_story.length == 1) {
     no_action = true;
     no_action_str = curr_story[0];
   }

  /**
   * check for invalid_intent
   */
   let intents_rawdata = fs.readFileSync('assets/botFiles/intents.json');
   let intents = JSON.parse(intents_rawdata);
   let invalid_intent = false;
   let invalid_intent_str = "";
   for(let i=0; i<story.examples.length; i++) {
      // intent
      let found = false;
      if(story.examples[i][0] == '*') {
        for(let j=0; j<intents.length; j++) {
          int = tools.strip(story.examples[i].substr(1, story.examples[i].length));
          if(intents[j].name == int) {
            found = true;
            break;
          }
        }
        if(!found) {
          invalid_intent = true;
          invalid_intent_str = story.examples[i];
          break;
        }
      }
   }

  /**
   * check for invalid_action
   */
   let actions_rawdata = fs.readFileSync('assets/botFiles/actions.json');
   let actions = JSON.parse(actions_rawdata);
   let invalid_action = false;
   let invalid_action_str = "";
   for(let i=0; i<story.examples.length; i++) {
      // action
      let found = false;
      if(story.examples[i][0] == '-') {
        for(let j=0; j<actions.length; j++) {
          act = tools.strip(story.examples[i].substr(1, story.examples[i].length));
          if(actions[j].name == act) {
            found = true;
            break;
          }
        }
        if(!found) {
          invalid_action = true;
          invalid_action_str = story.examples[i];
          break;
        }
      }
   }

  /**
   * check for title existed before?
   */
  let rawdata = fs.readFileSync(path);
  let stories = JSON.parse(rawdata);
  let title_existed = false;
  stories.forEach(function(old_story, index){
    if(old_story.name == story.name) {
      title_existed = true;
    }
  });

  return {
    empty: empty,
    title_existed: title_existed,
    invalid: invalid,
    invalid_str: invalid_str,
    no_action: no_action,
    no_action_str: no_action_str,
    invalid_intent: invalid_intent,
    invalid_intent_str: invalid_intent_str,
    invalid_action: invalid_action,
    invalid_action_str: invalid_action_str,
  }
}

function findStoryError(validation_results, options) {
  if(validation_results.empty == true) {
    return {"title": 'Your story is empty!', "body": "You must provide title for your story!"};
  }

  if(validation_results.invalid == true) {
    return {"title": 'Your story have invalid lines!', "body": 'Error in this line "' + validation_results.invalid_str + '"!'};
  }

  if(validation_results.no_action == true) {
    return {"title": 'Your story have intent that does not have an action!', "body": 'Error in this intent "' + validation_results.no_action_str + '"!'};
  }

  if(validation_results.invalid_intent == true) {
    return {"title": 'Your story have intent that does not exist!', "body": 'Error in this intent "' + validation_results.invalid_intent_str + '"!'};
  }

  if(validation_results.invalid_action == true) {
    return {"title": 'Your story have action that does not exist!', "body": 'Error in this action "' + validation_results.invalid_action_str + '"!'};
  }

  if(validation_results.title_existed == true && options['dups'] != false) {
    return {"title": 'Your story title is already existed!', "body": 'Please change the story title as it is already existed!'};
  }
  return false;
}

function isStoryValidwAction(story) {
  let validation_results = validateSingleStory(story);
  let error = findStoryError(validation_results, {"dups": true});

  if(error == false) {
    return true;
  }

  dialog.showErrorBox(error['title'], error['body']);
  return false;
}

ipcMain.on('validate-curr-story', (event, arg)=>{

  //get current story from front end
  var story = {
    name: arg.storyName,
    examples: arg.storyBody.split('\n')
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
    examples: arg.storyBody.split('\n')
  };
  story = cleanStory(story);

  if(!isStoryValidwAction(story)) {
    return;
  }

  let stories = JSON.parse(fs.readFileSync(path));
  stories.push(story);
  fs.writeFile(path, JSON.stringify(stories, null, 2), (err) => {
    if (err) {
      dialog.showErrorBox('Oops.. ', 'Something went wrong');
      return;
    }
    event.sender.send('stories-changed');
    event.sender.send('story-added');
  });
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
  let data = JSON.parse(fs.readFileSync(path));
  let edited = [];
  for (let i = 0; i < data.length; ++i) {
    if (data[i].name == arg)
      continue;
    edited.push(data[i]);
  }
  fs.writeFile(path, JSON.stringify(edited, null, 2), (err) => {
    if (err) {
      dialog.showErrorBox('Oops.. ', 'Something went wrong');
      return;
    }
    event.sender.send('stories-changed');
  });
})

module.exports = {
    validateSingleStory: validateSingleStory,
    findStoryError: findStoryError,
}
