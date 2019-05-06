const { ipcMain, dialog } = require('electron')
var fs = require('fs')
var tools = require('./tools')

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
   empty = false;
   if(story.name == '' ||
      story.examples.length == 0) {
    empty = true;
   }

  /**
   * check for invalid line in story body
   */
   invalid = false;
   invalid_str = "";
   for(i=0; i<story.examples.length; i++) {
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
   no_action = false;
   no_action_str = "";
   curr_story = [];
   for(i=0; i<story.examples.length; i++) {
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
   invalid_intent = false;
   invalid_intent_str = "";
   for(i=0; i<story.examples.length; i++) {
      // intent
      found = false;
      if(story.examples[i][0] == '*') {
        for(j=0; j<intents.length; j++) {
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
   invalid_action = false;
   invalid_action_str = "";
   for(i=0; i<story.examples.length; i++) {
      // action
      found = false;
      if(story.examples[i][0] == '-') {
        for(j=0; j<actions.length; j++) {
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
  let rawdata = fs.readFileSync('assets/botFiles/stories.json');
  let stories = JSON.parse(rawdata);
  title_existed = false;
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

ipcMain.on('validate-curr-story', (event, arg)=>{

  //get current story from front end
  var story = {
    name: arg.storyName,
    examples: arg.storyBody.split('\n')
  };
  story = cleanStory(story);

  validation_results = validateSingleStory(story);

  if(validation_results.empty == true) {
    dialog.showErrorBox('Your story is empty!', 'You must provide title and examples of your story!');
    return;
  }

  if(validation_results.invalid == true) {
    dialog.showErrorBox('Your story have invalid lines!', 'Error in this line "' + validation_results.invalid_str + '"!');
    return;
  }

  if(validation_results.no_action == true) {
    dialog.showErrorBox('Your story have intent that does not have an action!', 'Error in this intent "' + validation_results.no_action_str + '"!');
    return;
  }

  if(validation_results.invalid_intent == true) {
    dialog.showErrorBox('Your story have intent that does not exist!', 'Error in this intent "' + validation_results.invalid_intent_str + '"!');
    return;
  }

  if(validation_results.invalid_action == true) {
    dialog.showErrorBox('Your story have action that does not exist!', 'Error in this action "' + validation_results.invalid_action_str + '"!');
    return;
  }

  if(validation_results.title_existed == true) {
    dialog.showErrorBox('Your story title is already existed!', 'Please change the story title as it is already existed!');
    return;
  }

  dialog.showMessageBox({
    type: 'info',
    message: 'This is a valid story!',
  });

})


ipcMain.on('add-story', (event, arg)=> {
  var obj = {
    name: arg.storyName,
    examples: arg.storyBody.split('\n')
  };
  obj = cleanStory(obj);
  ok = true;
  let rawdata = fs.readFileSync('assets/botFiles/stories.json');
  let stories = JSON.parse(rawdata);
  for(let i = 0; i < stories.length; i++){
    if (stories[i].name == obj.name) {
      ok = false;
    }
  }
  if (!ok) {
    return;
  }
  stories.push(obj);
  fs.writeFile('assets/botFiles/stories.json', JSON.stringify(stories, null, 2), (err) => {
    if (err)
      throw err;
  });
})

ipcMain.on('load-story', (event, arg)=> {
    console.log("load story");
})
