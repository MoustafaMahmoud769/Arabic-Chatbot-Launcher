const { ipcMain, dialog, BrowserWindow } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')

var tools = require('./tools')
var slotsValitdatorObj = require('./slots_validator')

const path = 'assets/botFiles/slots.json';

function cleanSlot(entityObj) {

  entityObj.name = tools.strip(entityObj.name);
  entityObj.type = tools.strip(entityObj.type);
  entityObj.fmin = tools.strip(entityObj.fmin);
  entityObj.fmax = tools.strip(entityObj.fmax);

  for(let i = 0; i < entityObj.clist.length; i++) {
    entityObj.clist[i] = tools.strip(entityObj.clist[i]);
  }

  entityObj.clist = entityObj.clist.filter(Boolean);

  return entityObj;
}

function valid_slot_value(stored_slot, in_slot) {
  return slotsValitdatorObj.valid_slot_value(stored_slot, in_slot);
}

function validateSingleSlot(slot) {
  return slotsValitdatorObj.validateSingleSlot(slot);
}

function findSlotError(validation_results, options) {
  return slotsValitdatorObj.findSlotError(validation_results, options);
}

function isSlotValidwSlot(slot) {

  let validation_results = validateSingleSlot(slot);
  let error = findSlotError(validation_results, {"dups": slot.new_input});

  if(error == false) {
    return true;
  }

  dialog.showErrorBox(error['title'], error['body']);
  return false;
}

function remove_slot_fn(event, arg) {
  let data = JSON.parse(fs.readFileSync(path));
  let edited = [];
  for (let i = 0; i < data.length; ++i) {
    if (data[i].name == arg)
      continue;
    edited.push(data[i]);
  }
  fs.writeFileSync(path, JSON.stringify(edited, null, 2));
  event.sender.send('slots-changed');
}

ipcMain.on('validate-curr-slot', (event, arg)=>{

  //get current slot from front end
  var slot = {
    name: arg.slotName,
    type: arg.slotType,
    fmin: arg.floatMin,
    fmax: arg.floatMax,
    clist: arg.catList.split('\n'),
    new_input: arg.new_input
  };
  slot = cleanSlot(slot);

  if(!isSlotValidwSlot(slot)) {
    return;
  }

  dialog.showMessageBox({
    type: 'info',
    message: 'This is a valid slot!',
    buttons: ['Ok']
  });

})

ipcMain.on('add-slot', (event, arg)=> {

  var slot = {
    name: arg.slotName,
    type: arg.slotType,
    fmin: arg.floatMin,
    fmax: arg.floatMax,
    clist: arg.catList.split('\n'),
    new_input: arg.new_input
  };
  slot = cleanSlot(slot);

  if(!isSlotValidwSlot(slot)) {
    return;
  }

  slot = {
    name: slot.name,
    type: slot.type,
    fmin: slot.fmin,
    fmax: slot.fmax,
    clist: slot.clist
  };

  remove_slot_fn(event, slot.name);

  let slots = JSON.parse(fs.readFileSync(path));
  slots.push(slot);
  fs.writeFileSync(path, JSON.stringify(slots, null, 2));
  event.sender.send('slots-changed');
  event.sender.send('slot-added');
})

ipcMain.on('get-slots', (event, arg)=> {
  let data = JSON.parse(fs.readFileSync(path));
  event.sender.send('send-slots', data);
})

ipcMain.on('remove-slot', (event, arg)=> {
  remove_slot_fn(event, arg);
})

module.exports = {
    validateSingleSlot: validateSingleSlot,
    findSlotError: findSlotError,
    valid_slot_value: valid_slot_value,
}
