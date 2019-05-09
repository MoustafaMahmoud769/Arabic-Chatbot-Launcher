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
   empty = false;
   if(entity.name == '') {
    empty = true;
   }

  /**
   * found out if the one or more of the entity examples is also
   * an example of another entity.
   * found out if the title is already existed?
   */
  let rawdata = fs.readFileSync(path);
  let entites = JSON.parse(rawdata);
  title_existed = false;
  entites.forEach(function(old_entity, index){
    if(old_entity.name == entity.name) {
      title_existed = true;
    }
  });

  return {
    empty: empty,
    title_existed: title_existed
  }
}

ipcMain.on('validate-curr-entity', (event, arg)=>{

  //get current entity from front end
  var entity = {
    name: arg.entityName
  };
  entity = cleanEntity(entity);

  validation_results = validateSingleEntity(entity);

  if(validation_results.empty == true) {
    dialog.showErrorBox('Your entity is empty!', 'You must provide title for your entity!');
    return;
  }

  if(validation_results.title_existed == true) {
    dialog.showErrorBox('Your entity title is already existed!', 'Please change the entity title as it is already existed!');
    return;
  }

  dialog.showMessageBox({
    type: 'info',
    message: 'This is a valid entity!',
    detail: '',
  });

})

ipcMain.on('add-entity', (event, arg)=> {
  var entity = {
    name: arg.entityName
  };
  entity = cleanEntity(entity)
  validation_results = validateSingleEntity(entity);

  if(validation_results.empty == true) {
    dialog.showErrorBox('Your entity is empty!', 'You must provide title and examples of your entity!');
    return;
  }

  if(validation_results.title_existed == true) {
    dialog.showErrorBox('Your entity title is already existed!', 'Please change the entity title as it is already existed!');
    return;
  }
  let entites = JSON.parse(fs.readFileSync(path));
  entites.push(entity);
  fs.writeFile(path, JSON.stringify(entites, null, 2), (err) => {
    if (err)
      dialog.showErrorBox('Oops.. ', 'Something went wrong');
  });
  event.sender.send('entites-changed');
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
  let rawdata = fs.readFileSync(path);
  let data = JSON.parse(rawdata);
  event.sender.send('send-entites', data);
})

ipcMain.on('remove-entity', (event, arg)=> {
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
  });
  event.sender.send('entites-changed');
})
