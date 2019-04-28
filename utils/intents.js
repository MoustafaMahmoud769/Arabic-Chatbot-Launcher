const { ipcMain, dialog } = require('electron')
var fs = require('fs')
var tools = require('./tools')

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
  let rawdata = fs.readFileSync('assets/botFiles/intents.json');
  let intents = JSON.parse(rawdata);
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
    examples: arg.intentExamples.split('\n')
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
  });

})

ipcMain.on('add-intent', (event, arg)=> {
  var obj = {
    name: arg.intentName,
    examples: arg.intentExamples.split('\n')
  };
  obj = cleanIntent(obj);

  ok = true;
  let rawdata = fs.readFileSync('assets/botFiles/intents.json');
  let intents = JSON.parse(rawdata);
  for(let i = 0; i < intents.length; i++){
    if (intents[i].name == obj.name) {
      ok = false;
    }
  }
  if (!ok) {
    return;
  }
  intents.push(obj);
  fs.writeFile('assets/botFiles/intents.json', JSON.stringify(intents, null, 2), (err) => {
    if (err)
      throw err;
  });
})

ipcMain.on('load-intent', (event, arg)=> {
    console.log("load intent");
})
