const { ipcMain, dialog, BrowserWindow } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')

var tools = require('./tools')

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

function validateSingleSlot(slot) {

  /**
   * check if name or examples are empty!
   */
   let empty = false;
   if(slot.name == '') {
    empty = true;
   }

  /**
   * check for title existed before?
   */
  let slots = JSON.parse(fs.readFileSync(path));
  let title_existed = false;
  slots.forEach(function(old_slot, index){
    if(old_slot.name == slot.name) {
      title_existed = true;
    }
  });

  /**
   * check if type not supported!
   */
   let type_error = false;
   if(slot.type != "text" &&
   	  slot.type != "categorical" &&
   	  slot.type != "bool" &&
   	  slot.type != "float" &&
   	  slot.type != "list" &&
   	  slot.type != "unfeaturized") {
   		type_error = true;
   }

  /**
   * check float min & max
   */
   let float_error = false;
   if(slot.type == "float") {
   	  if(isNaN(parseFloat(slot.fmin)) ||
   	  	 isNaN(parseFloat(slot.fmax))) {
   	  	float_error = true;
   	  }
   }

  /**
   * check for duplications/empty in categories
   */
   let categories_duplications = false;
   let categories_empty = false;
   if(slot.type == "categorical") {
   	  if(slot.clist.length == 0) {
   	  	categories_empty = true;
   	  }
	  for(let i=0; i<slot.clist.length; i++) {
	  	for(let j=i+1; j<slot.clist.length; j++) {
	      if(slot.clist[i] == slot.clist[j]) {
            categories_duplications = true;
	      }
      	}
   	  }
   }



  return {
    empty: empty,
    title_existed: title_existed,
    type_error: type_error,
    float_error: float_error,
    categories_duplications: categories_duplications,
    categories_empty: categories_empty,
  }
}

function findSlotError(validation_results, options) {

  if(validation_results.empty == true) {
    return {"title": 'Your slot is empty!', "body": "You must provide title to your slot!"};
  }

  if(validation_results.title_existed == true && options['dups'] != false) {
    return {"title": 'Your slot title is already existed!', "body": "Please change the slot title as it is already existed!"};
  }

  if(validation_results.type_error == true) {
    return {"title": 'Your slot type is not correct!', "body": "Please choose valid slot type!"};
  }

  if(validation_results.float_error == true) {
    return {"title": 'Float values error in the slot!', "body": "Please choose valid float min & max."};
  }

  if(validation_results.categories_duplications == true) {
    return {"title": 'Categories duplication error!', "body": "Some of your categories is duplicated."};
  }

  if(validation_results.categories_empty == true) {
    return {"title": 'Categories empty!', "body": "You must provide some valid categories for your slot."};
  }

  return false;
}

function isSlotValidwSlot(slot, dups=true) {

  let validation_results = validateSingleSlot(slot);
  let error = findSlotError(validation_results, {"dups": dups});

  if(error == false) {
    return true;
  }

  dialog.showErrorBox(error['title'], error['body']);
  return false;
}


ipcMain.on('validate-curr-slot', (event, arg)=>{

  //get current slot from front end
  var slot = {
    name: arg.slotName,
    type: arg.slotType,
    fmin: arg.floatMin,
    fmax: arg.floatMax,
    clist: arg.catList.split('\n')
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
    clist: arg.catList.split('\n')
  };
  slot = cleanSlot(slot);

  if(!isSlotValidwSlot(slot)) {
    return;
  }

  let slots = JSON.parse(fs.readFileSync(path));
  slots.push(slot);
  fs.writeFile(path, JSON.stringify(slots, null, 2), (err) => {
    if (err) {
      dialog.showErrorBox('Oops.. ', 'Something went wrong');
      return;
    }
    event.sender.send('slots-changed');
    event.sender.send('slot-added');
  });
})

ipcMain.on('get-slots', (event, arg)=> {
  let data = JSON.parse(fs.readFileSync(path));
  event.sender.send('send-slots', data);
})

ipcMain.on('remove-slot', (event, arg)=> {
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
    event.sender.send('slots-changed');
  });
})
