const { ipcMain, dialog } = require('electron')
var fs = require('fs')
var tools = require('./tools')

function cleanEntity(entityObj) {
  entityObj.name = tools.strip(entityObj.name);
  for(i = 0; i < entityObj.examples.length; i++) {
    entityObj.examples[i] = tools.strip(entityObj.examples[i]);
  }
  entityObj.examples = entityObj.examples.filter(Boolean);
  return entityObj;
}

function validateSingleEntity(entity) {

  /**
   * check if name or examples are empty!
   */
   empty = false;
   if(entity.name == '' ||
      entity.examples.length == 0) {
    empty = true;
   }

  /**
   * check for duplications in entity examples
   */
   duplications = 0;
   for(i=0; i<entity.examples.length; i++) {
    for(j=i+1; j<entity.examples.length; j++) {
      if(entity.examples[i] == entity.examples[j]) {
        duplications++;
      }
    }
   }

  /**
   * found out if the one or more of the entity examples is also
   * an example of another entity.
   * found out if the title is already existed?
   */
  let rawdata = fs.readFileSync('assets/botFiles/entites.json');
  let entites = JSON.parse(rawdata);
  entites_matchs = 0;
  entites_names = [];
  title_existed = false;
  entites.forEach(function(old_entity, index){
    if(old_entity.name == entity.name) {
      title_existed = true;
    }
    for(i=0; i<old_entity.examples.length; i++) {
      for(k=0; k<entity.examples.length; k++) {
        if(old_entity.examples[i] == entity.examples[k]) {
          entites_matchs++;
          entites_names.push(old_entity.name);
        }
      }
    }
  });

  /**
   * found out the count of this entity examples have appeared
   * in the intents examples.
   */
  rawdata = fs.readFileSync('assets/botFiles/intents.json');
  let intents = JSON.parse(rawdata);
  //counter to save how many times this entity appeared in 
  //intents examples
  intents_counter = 0;
  intents.forEach(function(intent, index){
    for(i = 0; i < intent.examples.length; i++) {
      //break intent example into words
      intent.examples[i] = intent.examples[i].split(' ');
      //check for wanted words
      for(j=0; j<intent.examples[i].length; j++) {
        for(k=0; k<entity.examples.length; k++) {
          if(intent.examples[i][j] == entity.examples[k]) {
            intents_counter++;
          }
        }
      }
    }
  });

  return {
    empty: empty,
    title_existed: title_existed,
    duplications: duplications,
    entites_matchs: entites_matchs,
    entites_names: entites_names,
    intents_counter: intents_counter,
  }
}

ipcMain.on('validate-curr-entity', (event, arg)=>{

  //get current entity from front end
  var entity = {
    name: arg.entityName,
    examples: arg.entityExamples.split('\n')
  };
  entity = cleanEntity(entity);

  validation_results = validateSingleEntity(entity);

  if(validation_results.empty == true) {
    dialog.showErrorBox('Your entity is empty!', 'You must provide title and examples of your entity!');
    return;
  }

  if(validation_results.duplications != 0) {
    dialog.showErrorBox('Your entity examples have duplications!', 'One or more of your entity examples is repeated more than once!');
    return;
  }

  if(validation_results.title_existed == true) {
    dialog.showErrorBox('Your entity title is already existed!', 'Please change the entity title as it is already existed!');
    return;
  }

  if(validation_results.entites_matchs != 0) {
    dialog.showErrorBox('Entity examples are not unique!', 'Entity examples matches with other entities examples ' + validation_results.entites_matchs + ' time' + (validation_results.entites_matchs!=1?'s':'') + '! here is a list of entities name that share examples with this one:\n' + validation_results.entites_names);
    return;
  }

  if(validation_results.intents_counter == 0) {
    dialog.showErrorBox('No examples matches in any intents examples!', 'Entities examples must match words in intents examples to be effective!');
    return;
  }

  dialog.showMessageBox({
    type: 'info',
    message: 'This is a valid entity!',
    detail: 'It appeared a total of ' + validation_results.intents_counter + ' time' + (validation_results.intents_counter!=1?'s':'') + ' in the intents examples!',
  });

})

ipcMain.on('add-entity', (event, arg)=> {
  var obj = {
    name: arg.entityName,
    examples: arg.entityExamples.split('\n')
  };
  obj = cleanEntity(obj)

  ok = true;
  let rawdata = fs.readFileSync('assets/botFiles/entites.json');
  let entites = JSON.parse(rawdata);
  for(let i = 0; i < entites.length; i++){
    if (entites[i].name == obj.name) {
      ok = false;
    }
  }
  if (!ok) {
    return;
  }
  entites.push(obj);
  fs.writeFile('assets/botFiles/entites.json', JSON.stringify(entites, null, 2), (err) => {
    if (err)
      throw err;
  });
})

ipcMain.on('load-entity', (event, arg)=> {
    console.log("load entity");
})
