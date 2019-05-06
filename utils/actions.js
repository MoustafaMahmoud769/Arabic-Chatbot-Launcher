const { ipcMain, dialog } = require('electron')
var fs = require('fs')
var tools = require('./tools')

function cleanAction(entityObj) {
  entityObj.name = tools.strip(entityObj.name);
  for(i = 0; i < entityObj.examples.length; i++) {
    entityObj.examples[i] = tools.strip(entityObj.examples[i]);
  }
  entityObj.examples = entityObj.examples.filter(Boolean);
  return entityObj;
}

function validateSingleAction(action) {
  /**
   * check if name or examples are empty!
   */
   empty = false;
   if(action.name == '' ||
      action.examples.length == 0) {
    empty = true;
   }

  /**
   * check for duplications in action examples
   */
   duplications = 0;
   for(i=0; i<action.examples.length; i++) {
    for(j=i+1; j<action.examples.length; j++) {
      if(action.examples[i] == action.examples[j]) {
        duplications++;
      }
    }
   }

  /**
   * check for title existed before?
   */
  let rawdata = fs.readFileSync('assets/botFiles/actions.json');
  let actions = JSON.parse(rawdata);
  title_existed = false;
  actions.forEach(function(old_action, index){
    if(old_action.name == action.name) {
      title_existed = true;
    }
  });

  return {
    empty: empty,
    title_existed: title_existed,
    duplications: duplications,
  }
}

ipcMain.on('validate-curr-action', (event, arg)=>{

  //get current action from front end
  var action = {
    name: arg.actionName,
    examples: arg.actionExamples.split('\n')
  };
  action = cleanAction(action);

  validation_results = validateSingleAction(action);

  if(validation_results.empty == true) {
    dialog.showErrorBox('Your action is empty!', 'You must provide title and examples of your action!');
    return;
  }

  if(validation_results.duplications != 0) {
    dialog.showErrorBox('Your action examples have duplications!', 'One or more of your action examples is repeated more than once!');
    return;
  }

  if(validation_results.title_existed == true) {
    dialog.showErrorBox('Your action title is already existed!', 'Please change the action title as it is already existed!');
    return;
  }

  dialog.showMessageBox({
    type: 'info',
    message: 'This is a valid action!',
  });

})

ipcMain.on('add-action', (event, arg)=> {
  var obj = {
    name: arg.actionName,
    examples: arg.actionExamples.split('\n')
  };
  obj = cleanAction(obj)


  ok = true;
  let rawdata = fs.readFileSync('assets/botFiles/actions.json');
  let actions = JSON.parse(rawdata);
  for(let i = 0; i < actions.length; i++){
    if (actions[i].name == obj.name) {
      ok = false;
    }
  }
  if (!ok) {
    return;
  }
  actions.push(obj);
  fs.writeFile('assets/botFiles/actions.json', JSON.stringify(actions, null, 2), (err) => {
    if (err)
      throw err;
  });
})

ipcMain.on('load-action', (event, arg)=> {
    console.log("load action");
})
