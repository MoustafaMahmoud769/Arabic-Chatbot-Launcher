const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const csv = require('csv-parser')
var tools = require('./tools')
const path = 'assets/botFiles/intents.json';
const entities_path = 'assets/botFiles/entites.json';
var intentsValitdatorObj = require('./intents_validator')

function parseEntites(data, examples) {
  let cur = data.split('\n');
  let ret = [];
  for (let i = 0; i < cur.length; ++i) {
    //skip empty lines
    if(tools.strip(cur[i]) == '') {
      continue;
    }
    let obj = cur[i].split('\t');
    var entity = {
      from: parseInt(obj[0]), to: parseInt(obj[1]), index: parseInt(obj[2]), name: obj[4], value: obj[3]
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
  return intentsValitdatorObj.validateSingleIntent(intent);
}

function findIntentError(validation_results, options) {
  return intentsValitdatorObj.findIntentError(validation_results, options);
}

function isIntentValidwAction(intent) {

  let validation_results = validateSingleIntent(intent);
  let error = findIntentError(validation_results, {"dups": intent.new_input});

  if(error == false) {
    return true;
  }

  dialog.showErrorBox(error['title'], error['body']);
  return false;
}

function remove_intent_fn(event, arg) {
  let data = JSON.parse(fs.readFileSync(path));
  let edited = [];
  for (let i = 0; i < data.length; ++i) {
    if (data[i].name == arg)
      continue;
    edited.push(data[i]);
  }
  fs.writeFileSync(path, JSON.stringify(edited, null, 2));
  event.sender.send('intents-changed');

}

ipcMain.on('validate-curr-intent', (event, arg)=>{

  //get current intent from front end
  var intent = {
    name: arg.intentName,
    examples: arg.intentExamples.split('\n'),
    entites: parseEntites(arg.intentEntites, arg.intentExamples.split('\n')),
    new_input: arg.new_input
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
    entites: parseEntites(arg.intentEntites, arg.intentExamples.split('\n')),
    new_input: arg.new_input
  };
  intent = cleanIntent(intent);

  if(!isIntentValidwAction(intent)) {
    return;
  }

  intent = {
    name: intent.name,
    examples: intent.examples,
    entites: intent.entites
  };

  remove_intent_fn(event, intent.name);

  let intents = JSON.parse(fs.readFileSync(path));
  intents.push(intent);
  fs.writeFileSync(path, JSON.stringify(intents, null, 2));
  event.sender.send('intents-changed');
  event.sender.send('intent-added');
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
  remove_intent_fn(event, arg);
})

module.exports = {
    validateSingleIntent: validateSingleIntent,
    findIntentError: findIntentError,
}
