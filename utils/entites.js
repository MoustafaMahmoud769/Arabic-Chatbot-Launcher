const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')

var tools = require('./tools')

const path = 'assets/botFiles/entites.json';

function cleanEntity(entityObj) {
  entityObj.name = tools.strip(entityObj.name);
  return entityObj;
}

function validateSingleEntity(entity) {

  /**
   * check if name or examples are empty!
   */
   let empty = false;
   if(entity.name == '') {
    empty = true;
   }

  /**
   * check if valid name or not!
   */
   let invalid_name = !tools.valid_name(entity.name);

  /**
   * found out if the one or more of the entity examples is also
   * an example of another entity.
   * found out if the title is already existed?
   */
  let entites = JSON.parse(fs.readFileSync(path));
  let title_existed = false;
  entites.forEach(function(old_entity, index){
    if(old_entity.name == entity.name) {
      title_existed = true;
    }
  });

  return {
    empty: empty,
    invalid_name: invalid_name,
    title_existed: title_existed
  }
}

function findEntityError(validation_results, options){

  if(validation_results.empty == true) {
    return {"title": 'Your entity is empty!', "body": "You must provide title for your entity!"};
  }

  if(validation_results.invalid_name == true) {
    return {"title": 'Your entity name is invalid!', "body": "Your entity title must be [a|z] or [A|Z] or digits or special characters."};
  }

  if(validation_results.title_existed == true  && options['dups'] != false) {
    return {"title": 'Your entity title is already existed!', "body": "Please change the entity title as it is already existed!"};
  }
  return false;
}

function isEntityValidwAction(entity) {
  let validation_results = validateSingleEntity(entity);
  let error = findEntityError(validation_results, {"dups": entity.new_input});

  if(error == false) {
    return true;
  }

  dialog.showErrorBox(error['title'], error['body']);
  return false;
}


function remove_entity_fn(event, arg) {
  let data = JSON.parse(fs.readFileSync(path));
  let edited = [];
  for (let i = 0; i < data.length; ++i) {
    if (data[i].name == arg)
      continue;
    edited.push(data[i]);
  }
  fs.writeFileSync(path, JSON.stringify(edited, null, 2));
  event.sender.send('entites-changed');
}


ipcMain.on('validate-curr-entity', (event, arg)=>{

  //get current entity from front end
  var entity = {
    name: arg.entityName,
    new_input: arg.new_input
  };
  entity = cleanEntity(entity);

  if(!isEntityValidwAction(entity)) {
    return;
  }

  dialog.showMessageBox({
    type: 'info',
    message: 'This is a valid entity!',
    detail: '',
    buttons: ['Ok']
  });

})

ipcMain.on('add-entity', (event, arg)=> {
  var entity = {
    name: arg.entityName,
    new_input: arg.new_input
  };
  entity = cleanEntity(entity)

  if(!isEntityValidwAction(entity)) {
    return;
  }

  entity = {
    name: entity.name,
  }

  remove_entity_fn(event, entity.name);

  let entites = JSON.parse(fs.readFileSync(path));
  entites.push(entity);
  fs.writeFileSync(path, JSON.stringify(entites, null, 2));
  event.sender.send('entites-changed');
  event.sender.send('entity-added');
})

ipcMain.on('load-entity', (event, arg)=> {
  let results = [];
  var set = new Set();
  let data = JSON.parse(fs.readFileSync(path));
  for (let i = 0; i < data.length; i++)
    set.add(data[i].name);
  var added = 0;
  fs.createReadStream(arg)
    .pipe(csv(['name']))
    .on('data', (data) => results.push(data))
    .on('end', () => {
      for (let i = 0; i < results.length; i++) {
        row = results[i];
        if (row.hasOwnProperty('name') && !set.has(row.name)) {
          data.push(row);
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
          detail: 'Added ' + added.toString(10) + ' Entites.',
          buttons: ['Ok']
        });
        event.sender.send('entites-changed');
      });
    });
})

ipcMain.on('get-entites', (event, arg)=> {
  let data = JSON.parse(fs.readFileSync(path));
  event.sender.send('send-entites', data);
})

ipcMain.on('remove-entity', (event, arg)=> {
  remove_entity_fn(event, arg);
})

module.exports = {
    validateSingleEntity: validateSingleEntity,
    findEntityError: findEntityError,
}
