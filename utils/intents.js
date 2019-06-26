const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')

var tools = require('./tools')

const path = 'assets/botFiles/intents.json';
const entities_path = 'assets/botFiles/entites.json';

function parseEntites(data, examples) {
  let cur = data.split('\n');
  if (cur[cur.length - 1] == '')
    cur.pop();
  let ret = [];
  for (let i = 0; i < cur.length; ++i) {
    let obj = cur[i].split('\t');
    var entity = {
      from: parseInt(obj[0]), to: parseInt(obj[1]), index: parseInt(obj[2]), name: obj[4], value: examples[parseInt(obj[2])].substring(obj[0], obj[1])
    };
    ret.push(entity);
  }
  return ret;
}

function cleanIntent(intentObj) {
  intentObj.name = tools.strip(intentObj.name);
  for(let i = 0; i < intentObj.examples.length; i++) {
    intentObj.examples[i] = tools.strip(intentObj.examples[i]);
  }
  intentObj.examples = intentObj.examples.filter(Boolean);
  return intentObj;
}


function validateSingleIntent(intent) {
  /**
   * check if name or examples are empty!
   */
   let empty = false;
   if(intent.name == '' ||
      intent.examples.length == 0) {
    empty = true;
   }

   /**
   * check number of intent examples
   */
   let intent_small_examples = false;
   if(intent.examples.length < 2) {
      intent_small_examples = true;
   }

  /**
   * check for duplications in intent examples
   */
   let duplications = 0;
   for(let i=0; i<intent.examples.length; i++) {
    for(let j=i+1; j<intent.examples.length; j++) {
      if(intent.examples[i] == intent.examples[j]) {
        duplications++;
      }
    }
   }

  /**
   * check for title existed before?
   */
  let intents = JSON.parse(fs.readFileSync(path));
  let title_existed = false;
  intents.forEach(function(old_intent, index){
    if(old_intent.name == intent.name) {
      title_existed = true;
    }
  });

  /**
   * check for errors in indices
   */
  let indices_error = false;
  let indices_error_i = -1;
  for (let i=0; i<intent.entites.length; i++) {
    if (isNaN(intent.entites[i].from) ||
        isNaN(intent.entites[i].to) ||
        isNaN(intent.entites[i].index) ) {
      indices_error = true;
      indices_error_i = i;
      break;
    }
  }

  /**
   * load all entities
   */
  let entities = JSON.parse(fs.readFileSync(entities_path));

  /**
   * validate every entity entry
   */
  let entity_error = false;
  let entity_error_i = -1;
  let overlapping_indices = false;
  let overlapping_indices_i = -1;
  let entity_title_existed = true

  let map_of_ind = {}
  for (let m=0; m<intent.entites.length; m++) {

    let from = intent.entites[m].from
    let to = intent.entites[m].to
    let ind = intent.entites[m].index
    let name = intent.entites[m].name

    //check if existed - only for full validation
    let entity_title_existed = false
    entities.forEach(function(entity, index){
      if(entity.name == name) {
        entity_title_existed = true;
      }
    });

    if(entity_title_existed === false) {
      break;
    }

    if (!isNaN(from) && !isNaN(to) && !isNaN(ind)) {

      // check index exist
      if(ind < 0 || ind >= intent.examples.length) {
        entity_error = true;
        entity_error_i = i;
        break;
      }

      //check from & to
      if(from < 0 || from > intent.examples[ind].length) {
        entity_error = true;
        entity_error_i = i;
        break;
      }
      if(to < 0 || to > intent.examples[ind].length) {
        entity_error = true;
        entity_error_i = i;
        break;
      }
      if(from > to) {
        entity_error = true;
        entity_error_i = i;
        break;
      }

      // overlapping indices
      if (ind in map_of_ind) {
        for(let i=from; i<to; i++) {
          if (i in map_of_ind[ind]) {
            overlapping_indices = true;
            overlapping_indices_i = ind;
            break;
          }
          map_of_ind[ind][i] = 1;
        }
      } else {
        map_of_ind[ind] = {};
        for(let i=from; i<to; i++) {
          map_of_ind[ind][i] = 1;
        }
      }

      if (overlapping_indices) {
        break;
      }

    }
  }

  return {
    empty: empty,
    title_existed: title_existed,
    entity_title_existed: entity_title_existed,
    duplications: duplications,
    indices_error: indices_error,
    indices_error_i: indices_error_i,
    entity_error: entity_error,
    entity_error_i: entity_error_i,
    overlapping_indices: overlapping_indices,
    overlapping_indices_i: overlapping_indices_i,
    intent_small_examples: intent_small_examples,
  }
}

function findIntentError(validation_results, options) {
  if (validation_results.intent_small_examples == true) {
    return {"title": 'Intent examples are tiny!', "body": "You must at least two examples for each intent!"};
  }
  
  if(validation_results.empty == true) {
    return {"title": 'Your intent is empty!', "body": "You must provide title for your intent!"};
  }

  if(validation_results.duplications != 0) {
    return {"title": 'Your intent examples have duplications!', "body": "One or more of your intent examples is repeated more than once!"};
  }

  if(validation_results.title_existed == true && options['dups'] != false) {
    return {"title": 'Your intent title is already existed!', "body": "Please change the intent title as it is already existed!"};
  }

  if(validation_results.entity_title_existed == false) {
    return {"title": 'Your intent has undefined entity', "body": "Please define the missing entities."};
  }

  if(validation_results.indices_error == true) {
    return {"title": 'Your intent has entity with non-numeric indices!', "body": 'The entity number ' + (validation_results.indices_error_i + 1) + ' has non-numeric indices, please fix it!'};
  }

  if(validation_results.entity_error == true) {
    return {"title": 'Your intent has entity with invalid [logically] indices!', "body": 'The entity number ' + (validation_results.entity_error_i + 1) + ' has error in its indices, please fix it!'};
  }

  if(validation_results.overlapping_indices == true) {
    return {"title": 'Your example has multiple entities with overlapping indices!', "body": 'The intent example ' + (intent.entites[validation_results.overlapping_indices_i].index + 1) + ' has multiple entities with overlapping indices, please fix it!'};
  }
  return false;
}

function isIntentValidwAction(intent) {

  let validation_results = validateSingleIntent(intent);
  let error = findIntentError(validation_results, {"dups": true});

  if(error == false) {
    return true;
  }

  dialog.showErrorBox(error['title'], error['body']);
  return false;
}

ipcMain.on('validate-curr-intent', (event, arg)=>{

  //get current intent from front end
  var intent = {
    name: arg.intentName,
    examples: arg.intentExamples.split('\n'),
    entites: parseEntites(arg.intentEntites, arg.intentExamples.split('\n'))
  };
  intent = cleanIntent(intent);

  if(!isIntentValidwAction(intent)) {
    return;
  }

  dialog.showMessageBox({
    type: 'info',
    message: 'This is a valid intent!',
    buttons: ['Ok']
  });

})

ipcMain.on('add-intent', (event, arg)=> {
  var intent = {
    name: arg.intentName,
    examples: arg.intentExamples.split('\n'),
    entites: parseEntites(arg.intentEntites, arg.intentExamples.split('\n'))
  };
  intent = cleanIntent(intent);

  if(!isIntentValidwAction(intent)) {
    return;
  }

  let intents = JSON.parse(fs.readFileSync(path));
  intents.push(intent);
  fs.writeFile(path, JSON.stringify(intents, null, 2), (err) => {
    if (err) {
      dialog.showErrorBox('Oops.. ', 'Something went wrong');
      return;
    }
    event.sender.send('intents-changed');
    event.sender.send('intent-added');
  });
})

ipcMain.on('load-intent', (event, arg)=> {
  let results = [];
  var set = new Set();
  let data = JSON.parse(fs.readFileSync(path));
  for (let i = 0; i < data.length; i++)
    set.add(data[i].name);
  let added = 0;
  fs.createReadStream(paths[0])
    .pipe(csv(['name', 'examples', 'entites']))
    .on('data', (data) => results.push(data))
    .on('end', () => {
      for (let i = 0; i < results.length; i++) {
        row = results[i];
        if (row.hasOwnProperty('name') && row.hasOwnProperty('examples') && !set.has(row.name)) {
          let newRow = { name: row.name, examples: row.examples.split('\n'), entites: parseEntites(row.entites) };
          data.push(newRow);
          ++added;
        }
        set.add(row.name);
      }
      fs.writeFile('assets/botFiles/intents.json', JSON.stringify(data, null, 2), (err) => {
        if (err) {
          dialog.showErrorBox('Oops.. ', 'Something went wrong');
          return;
        }
        dialog.showMessageBox({
          type: 'info',
          message: 'Loaded Successfully',
          detail: 'Added ' + added.toString(10) + ' Intents.',
          buttons: ['Ok']
        });
        event.sender.send('intents-changed');
      });
    });
})

ipcMain.on('get-intents', (event, arg)=> {
  let data = JSON.parse(fs.readFileSync(path));
  event.sender.send('send-intents', data);
})

ipcMain.on('remove-intent', (event, arg)=> {
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
    event.sender.send('intents-changed');
  });
})

module.exports = {
    validateSingleIntent: validateSingleIntent,
    findIntentError: findIntentError,
}
