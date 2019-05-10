const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')

var tools = require('./tools')

const path = 'assets/botFiles/intents.json';

function parseEntites(data) {
  let cur = data.split('\n');
  if (cur[cur.length - 1] == '')
    cur.pop();
  let ret = [];
  for (let i = 0; i < cur.length; ++i) {
    let obj = cur[i].split('\t');
    var entity = {
      from: parseInt(obj[0]), to: parseInt(obj[1]), value: parseInt(obj[2]), name: obj[3]
    };
    ret.push(entity);
  }
  return ret;
}

function cleanIntent(intentObj) {
  intentObj.name = tools.strip(intentObj.name);
  for(i = 0; i < intentObj.examples.length; i++) {
    intentObj.examples[i] = tools.strip(intentObj.examples[i]);
  }
  intentObj.examples = intentObj.examples.filter(Boolean);
  return intentObj;
}


function validateSingleIntent(intent) {
  /**
   * check if name or examples are empty!
   */
   empty = false;
   if(intent.name == '' ||
      intent.examples.length == 0) {
    empty = true;
   }

  /**
   * check for duplications in intent examples
   */
   duplications = 0;
   for(i=0; i<intent.examples.length; i++) {
    for(j=i+1; j<intent.examples.length; j++) {
      if(intent.examples[i] == intent.examples[j]) {
        duplications++;
      }
    }
   }

  /**
   * check for title existed before?
   */
  let intents = JSON.parse(fs.readFileSync(path));
  title_existed = false;
  intents.forEach(function(old_intent, index){
    if(old_intent.name == intent.name) {
      title_existed = true;
    }
  });

  /**
   * check for errors in indices
   */
  indices_error = false;
  indices_error_i = -1;
  for (i=0; i<intent.entites.length; i++) {
    if (isNaN(intent.entites[i].from) ||
        isNaN(intent.entites[i].to) ||
        isNaN(intent.entites[i].value) ) {
      indices_error = true;
      indices_error_i = i;
      break;
    }
  }

  /**
   * validate every entity entry
   */
  entity_error = false;
  entity_error_i = -1;
  overlapping_indices = false;
  overlapping_indices_i = -1;

  map_of_ind = {}
  for (m=0; m<intent.entites.length; m++) {

    from = intent.entites[m].from
    to = intent.entites[m].to
    ind = intent.entites[m].value

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
      if(to < 0 || to >= intent.examples[ind].length) {
        entity_error = true;
        entity_error_i = i;
        break;
      }
      if(from >= to) {
        entity_error = true;
        entity_error_i = i;
        break;
      }

      // overlapping indices
      if (ind in map_of_ind) {
        for(i=from; i<to; i++) {
          if (i in map_of_ind[ind]) {
            overlapping_indices = true;
            overlapping_indices_i = ind;
            break;
          }
          map_of_ind[ind][i] = 1;
        }
      } else {
        map_of_ind[ind] = {};
        for(i=from; i<to; i++) {
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
    duplications: duplications,
    indices_error: indices_error,
    indices_error_i: indices_error_i,
    entity_error: entity_error,
    entity_error_i: entity_error_i,
    overlapping_indices: overlapping_indices,
    overlapping_indices_i: overlapping_indices_i,
  }
}

function is_valid_action(intent) {

  validation_results = validateSingleIntent(intent);

  if(validation_results.empty == true) {
    dialog.showErrorBox('Your intent is empty!', 'You must provide title and examples of your intent!');
    return false;
  }

  if(validation_results.duplications != 0) {
    dialog.showErrorBox('Your intent examples have duplications!', 'One or more of your intent examples is repeated more than once!');
    return false;
  }

  if(validation_results.title_existed == true) {
    dialog.showErrorBox('Your intent title is already existed!', 'Please change the intent title as it is already existed!');
    return false;
  }

  if(validation_results.indices_error == true) {
    dialog.showErrorBox('Your intent has entity with non-numeric indices!', 'The entity number ' + (validation_results.indices_error_i + 1) + ' has non-numeric indices, please fix it!');
    return false;
  }

  if(validation_results.entity_error == true) {
    dialog.showErrorBox('Your intent has entity with invalid [logically] indices!', 'The entity number ' + (validation_results.entity_error_i + 1) + ' has error in its indices, please fix it!');
    return false;
  }

  if(validation_results.overlapping_indices == true) {
    dialog.showErrorBox('Your example has multiple entities with overlapping indices!', 'The intent example ' + (intent.entites[validation_results.overlapping_indices_i].value + 1) + ' has multiple entities with overlapping indices, please fix it!');
    return false;
  }

  //TODO: check for similarity with other intents!!
  return true;
}

ipcMain.on('validate-curr-intent', (event, arg)=>{

  //get current intent from front end
  var intent = {
    name: arg.intentName,
    examples: arg.intentExamples.split('\n'),
    entites: parseEntites(arg.intentEntites)
  };
  intent = cleanIntent(intent);

  if(!is_valid_action(intent)) {
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
    entites: parseEntites(arg.intentEntites)
  };
  intent = cleanIntent(intent);

  if(!is_valid_action(intent)) {
    return;
  }

  let intents = JSON.parse(fs.readFileSync(path));
  intents.push(intent);
  fs.writeFile(path, JSON.stringify(intents, null, 2), (err) => {
    if (err)
      dialog.showErrorBox('Oops.. ', 'Something went wrong');
      return;
  });
  event.sender.send('intents-changed');
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
  });
  event.sender.send('intents-changed');
})
