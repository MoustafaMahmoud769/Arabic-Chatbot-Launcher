const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')
var slotsObj = require('./slots')

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

function get_slot_data(str) {
  
  let slot_name = "";
  let slot_value = "";
  let valid = false;
  let i = 0;
  
  // get slot name
  for (i=0; i<str.length; i++) {
    if(str[i] == " ") {
      break;
    }
    slot_name += str[i];
  }

  // skip -> sign
  i += 4
  for (; i<str.length; i++) {
    slot_value += str[i];
  }

  if(slot_name != "" && slot_value != "") {
    valid = true;
  }

  return {
    valid: valid,
    name: slot_name,
    value: slot_value,
  }
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
   * check if valid name or not!
   */
   let invalid_name = !tools.valid_name(story.name);

  /**
   * check for invalid line in story body
   */
   let invalid = false;
   let invalid_str = "";
   for(let i=0; i<story.examples.length; i++) {
      if(story.examples[i][0] != '*' &&
         story.examples[i][0] != '-' &&
         story.examples[i][0] != '$'
         ) {
        invalid_str = story.examples[i];
        invalid = true;
        break;
      }
   }

  /**
   * check for no_action or no_slot
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
      if((story.examples[i][0] == '-' || story.examples[i][0] == '$') && curr_story.length > 0) {
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
   * check for invalid_slot
   */
   let slots_rawdata = fs.readFileSync('assets/botFiles/slots.json');
   let slots = JSON.parse(slots_rawdata);
   let invalid_slot = false;
   let invalid_slot_str = "";
   for(let i=0; i<story.examples.length; i++) {
      // slot
      let found = false;

      if(story.examples[i][0] == '$') {

        let in_slot = tools.strip(story.examples[i].substr(1, story.examples[i].length));
        let stored_slot;

        // get name and value!
        slot_data = get_slot_data(in_slot);
        if(slot_data.valid == false) {
          invalid_slot = true;
          invalid_slot_str = story.examples[i];
          break;
        }

        for(let j=0; j<slots.length; j++) {
          if(slots[j].name == slot_data.name) {
            found = true;
            stored_slot = slots[j];
            break;
          }
        }

        if(!found) {
          invalid_slot = true;
          invalid_slot_str = story.examples[i];
          break;
        }

        // validate the type if found
        if(slotsObj.valid_slot_value(stored_slot, slot_data.value) == false) {
          invalid_slot = true;
          invalid_slot_str = story.examples[i];
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
    invalid_name: invalid_name,
    title_existed: title_existed,
    invalid: invalid,
    invalid_str: invalid_str,
    no_action: no_action,
    no_action_str: no_action_str,
    invalid_intent: invalid_intent,
    invalid_intent_str: invalid_intent_str,
    invalid_action: invalid_action,
    invalid_action_str: invalid_action_str,
    invalid_slot: invalid_slot,
    invalid_slot_str: invalid_slot_str,
  }
}

function findStoryError(validation_results, options){
  
  if(validation_results.empty == true) {
    return {"title": 'Your story is empty!', "body": "You must provide title for your story!"};
  }

  if(validation_results.invalid_name == true) {
    return {"title": 'Your name is invalid!', "body": "Your story title must be [a|z] or [A|Z] or digits or special characters."};
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

  if(validation_results.invalid_slot == true) {
    return {"title": 'Your story have slot that have errors!', "body": 'Error in this slot "' + validation_results.invalid_slot_str + '"!'};
  }

  if(validation_results.title_existed == true && options['dups'] != false) {
    return {"title": 'Your story title is already existed!', "body": 'Please change the story title as it is already existed!'};
  }
  return false;
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
