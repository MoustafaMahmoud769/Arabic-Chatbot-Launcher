const { ipcMain, dialog, BrowserWindow } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')
var slotsObj = require('./slots_validator')
var tools = require('./tools')
const path = 'assets/botFiles/actions.json';
var actionsValitdatorObj = require('./actions_validator')

function cleanAction(entityObj) {
  //name
  entityObj.name = tools.strip(entityObj.name);
  //examples
  for(let i = 0; i < entityObj.examples.length; i++) {
    entityObj.examples[i] = tools.strip(entityObj.examples[i]);
  }
  entityObj.examples = entityObj.examples.filter(Boolean);
  //slots
  for(let i = 0; i < entityObj.slots.length; i++) {
    entityObj.slots[i] = tools.strip(entityObj.slots[i]);
  }
  entityObj.slots = entityObj.slots.filter(Boolean);
  //done
  return entityObj;
}

function parse_buttons_data(slots) {
  return actionsValitdatorObj.parse_buttons_data(slots);
}

function validate_single_button(button) {
  return actionsValitdatorObj.validate_single_button(button);
}

function validateSingleAction(action) {
  return actionsValitdatorObj.validateSingleAction(action);
}

function findActionError(validation_results, options) {
  return actionsValitdatorObj.findActionError(validation_results, options);
}

function isActionValidwAction(action) {

  let validation_results = validateSingleAction(action);
  let error = findActionError(validation_results, {"dups": action.new_input});

  if(error == false) {
    return true;
  }

  dialog.showErrorBox(error['title'], error['body']);
  return false;
}

function remove_action_fn(event, arg) {
  let data = JSON.parse(fs.readFileSync(path));
  let edited = [];
  for (let i = 0; i < data.length; ++i) {
    if (data[i].name == arg)
      continue;
    edited.push(data[i]);
  }
  fs.writeFileSync(path, JSON.stringify(edited, null, 2));
  event.sender.send('actions-changed');
}

ipcMain.on('validate-curr-action', (event, arg)=>{

  //get current action from front end
  var action = {
    name: arg.actionName,
    new_input: arg.new_input,
    examples: arg.actionExamples.split('\n'),
    slots: arg.actionSlots.split('\n')
  };
  action = cleanAction(action);
  console.log(action)
  
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
    new_input: arg.new_input,
    examples: arg.actionExamples.split('\n'),
    slots: arg.actionSlots.split('\n')
  };
  action = cleanAction(action);

  if(!isActionValidwAction(action)) {
    return;
  }

  action = {
    name: action.name,
    examples: action.examples,
    slots: action.slots
  };

  remove_action_fn(event, action.name);

  let actions = JSON.parse(fs.readFileSync(path));
  actions.push(action);
  fs.writeFileSync(path, JSON.stringify(actions, null, 2));
  event.sender.send('actions-changed');
  event.sender.send('action-added');
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
  remove_action_fn(event, arg);
})

module.exports = {
  validateSingleAction: validateSingleAction,
  findActionError: findActionError,
  validate_single_button: validate_single_button,
  parse_buttons_data: parse_buttons_data,
}