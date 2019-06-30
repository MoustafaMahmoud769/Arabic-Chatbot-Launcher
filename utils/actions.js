const { ipcMain, dialog, BrowserWindow } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')
var slotsObj = require('./slots')

var tools = require('./tools')

const path = 'assets/botFiles/actions.json';

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

function parse_buttons_data(slots)
{  
  buttons = []
  
  if(slots.length < 3) {
    return buttons;
  }

  for (let i=0; i<slots.length; i+=3) {
    new_button = {
      value: slots[i].substring(14),
      slot_name: slots[i+1].substring(11),
      slot_value: slots[i+2].substring(12),
    };
    buttons.push(new_button);
  }

  return buttons;
}

function validate_single_button(button)
{
  if(button.value.length == 0) {
    return false;
  }

  if(button.slot_name.length == 0) {
    return false;
  }
  
  if(button.slot_value.length == 0) {
    return false;
  }

  let slots_rawdata = fs.readFileSync('assets/botFiles/slots.json');
  let slots = JSON.parse(slots_rawdata);
  let invalid_slot = false;
  let invalid_slot_str = "";

  // slot
  let found = false;
  let stored_slot;

  for(let j=0; j<slots.length; j++) {
    if(slots[j].name == button.slot_name) {
      found = true;
      stored_slot = slots[j];
      break;
    }
  }

  if(!found) {
    invalid_slot = true;
    invalid_slot_str = "{" + button.value + ", " + button.slot_name + ", " + button.slot_value + "}";
  } else {
    // validate the type if found
    if(slotsObj.valid_slot_value(stored_slot, button.slot_value) == false) {
      invalid_slot = true;
      invalid_slot_str = "{" + button.value + ", " + button.slot_name + ", " + button.slot_value + "}";
    }
  }

  return {
    invalid_slot: invalid_slot,
    invalid_slot_str: invalid_slot_str,
  }
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
   * check if valid name or not!
   */
   let invalid_name = !tools.valid_name(action.name);

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
   * verify buttons!
   */
   let invalid_slot = false;
   let invalid_slot_str = "";
   let buttons = parse_buttons_data(action.slots)
   for(let i=0; i<buttons.length; i++) {
    let vsb = validate_single_button(buttons[i]);
    if(vsb.invalid_slot == true) {
      invalid_slot = vsb.invalid_slot;
      invalid_slot_str = vsb.invalid_slot_str;
      break;
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
    invalid_name: invalid_name,
    title_existed: title_existed,
    duplications: duplications,
    invalid_slot: invalid_slot,
    invalid_slot_str: invalid_slot_str
  }
}

function findActionError(validation_results, options) {

  if(validation_results.empty == true) {
    return {"title": 'Your action is empty!', "body": "You must provide title and examples of your action!"};
  }

  if(validation_results.invalid_name == true) {
    return {"title": 'Your action name is invalid!', "body": "Your action title must be [a|z] or [A|Z] or digits or special characters."};
  }

  if(validation_results.duplications != 0) {
    return {"title": 'Your action examples have duplications!', "body": "One or more of your action examples is repeated more than once!"};
  }

  if(validation_results.title_existed == true && options['dups'] != false) {
    return {"title": 'Your action title is already existed!', "body": "Please change the action title as it is already existed!"};
  }

  if(validation_results.invalid_slot == true) {
    return {"title": 'Your action has invalid button!', "body": "Please fix this button please! -> " + validation_results.invalid_slot_str};
  }

  return false;
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
  parse_buttons_data: parse_buttons_data,
}