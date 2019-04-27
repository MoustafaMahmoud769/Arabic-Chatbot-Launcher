const { ipcMain } = require('electron')
var fs = require('fs')

ipcMain.on('add-intent', (event, arg)=> {
  var obj = {
    name: arg.intentName,
    examples: arg.intentExamples.split('\n')
  };
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
