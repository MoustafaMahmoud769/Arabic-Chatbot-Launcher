const { ipcMain, dialog, BrowserWindow } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')

var tools = require('./tools')

const path = 'assets/botFiles/actions.json';

function cleanAction(entityObj) {
  entityObj.name = tools.strip(entityObj.name);
  for(let i = 0; i < entityObj.examples.length; i++) {
    entityObj.examples[i] = tools.strip(entityObj.examples[i]);
  }
  entityObj.examples = entityObj.examples.filter(Boolean);
  return entityObj;
}

function validateSingleAction(action) {
  /**
   * check if name or examples are empty!
   */
   let empty = false;
   if(action.name == '' ||
      action.examples.length == 0) {
    empty = true;
   }

  /**
   * check for duplications in action examples
   */
   let duplications = 0;
   for(let i=0; i<action.examples.length; i++) {
    for(let j=i+1; j<action.examples.length; j++) {
      if(action.examples[i] == action.examples[j]) {
        duplications++;
      }
    }
   }

  /**
   * check for title existed before?
   */
  let actions = JSON.parse(fs.readFileSync(path));
  let title_existed = false;
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

function findActionError(validation_results, options) {

  if(validation_results.empty == true) {
    return {"title": 'Your action is empty!', "body": "You must provide title and examples of your action!"};
  }

  if(validation_results.duplications != 0) {
    return {"title": 'Your action examples have duplications!', "body": "One or more of your action examples is repeated more than once!"};
  }

  if(validation_results.title_existed == true && options['dups'] != false) {
    return {"title": 'Your action title is already existed!', "body": "Please change the action title as it is already existed!"};
  }

  return false;
}

function isActionValidwAction(action, dups=true) {

  let validation_results = validateSingleAction(action);
  let error = findActionError(validation_results, {"dups": dups});

  if(error == false) {
    return true;
  }

  dialog.showErrorBox(error['title'], error['body']);
  return false;
}


ipcMain.on('validate-curr-action', (event, arg)=>{

  //get current action from front end
  var action = {
    name: arg.actionName,
    examples: arg.actionExamples.split('\n')
  };
  action = cleanAction(action);

  if(!isActionValidwAction(action)) {
    return;
  }

  dialog.showMessageBox({
    type: 'info',
    message: 'This is a valid action!',
    buttons: ['Ok']
  });

})

ipcMain.on('add-action', (event, arg)=> {
  var action = {
    name: arg.actionName,
    examples: arg.actionExamples.split('\n')
  };
  action = cleanAction(action);

  if(!isActionValidwAction(action)) {
    return;
  }

  let actions = JSON.parse(fs.readFileSync(path));
  actions.push(action);
  fs.writeFile(path, JSON.stringify(actions, null, 2), (err) => {
    if (err) {
      dialog.showErrorBox('Oops.. ', 'Something went wrong');
      return;
    }
    event.sender.send('actions-changed');
    event.sender.send('action-added');
  });
})

ipcMain.on('load-action', (event, arg)=> {
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
          detail: 'Added ' + added.toString(10) + ' Actions.',
          buttons: ['Ok']
        });
        event.sender.send('actions-changed');
      });
    });
})

ipcMain.on('get-actions', (event, arg)=> {
  let data = JSON.parse(fs.readFileSync(path));
  event.sender.send('send-actions', data);
})

ipcMain.on('remove-action', (event, arg)=> {
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
    event.sender.send('actions-changed');
  });
})

module.exports = {
  validateSingleAction: validateSingleAction,
  findActionError: findActionError,
}