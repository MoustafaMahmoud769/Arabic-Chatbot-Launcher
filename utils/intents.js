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
    //TODO : parse value
    var entity = {
      from: obj[0], to: obj[1], value: obj[2], name: obj[3]
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

  return {
    empty: empty,
    title_existed: title_existed,
    duplications: duplications,
  }
}

ipcMain.on('validate-curr-intent', (event, arg)=>{

  //get current intent from front end
  var intent = {
    name: arg.intentName,
    examples: arg.intentExamples.split('\n'),
    entites: parseEntites(arg.intentEntites)
  };
  intent = cleanIntent(intent);

  validation_results = validateSingleIntent(intent);

  if(validation_results.empty == true) {
    dialog.showErrorBox('Your intent is empty!', 'You must provide title and examples of your intent!');
    return;
  }

  if(validation_results.duplications != 0) {
    dialog.showErrorBox('Your intent examples have duplications!', 'One or more of your intent examples is repeated more than once!');
    return;
  }

  if(validation_results.title_existed == true) {
    dialog.showErrorBox('Your intent title is already existed!', 'Please change the intent title as it is already existed!');
    return;
  }

  //TODO: check for similarity with other intents!!

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

  validation_results = validateSingleIntent(intent);

  if(validation_results.empty == true) {
    dialog.showErrorBox('Your intent is empty!', 'You must provide title and examples of your intent!');
    return;
  }

  if(validation_results.duplications != 0) {
    dialog.showErrorBox('Your intent examples have duplications!', 'One or more of your intent examples is repeated more than once!');
    return;
  }

  if(validation_results.title_existed == true) {
    dialog.showErrorBox('Your intent title is already existed!', 'Please change the intent title as it is already existed!');
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
