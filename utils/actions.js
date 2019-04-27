const { ipcMain } = require('electron')
var fs = require('fs')

ipcMain.on('add-action', (event, arg)=> {
  var obj = {
    name: arg.actionName,
    examples: arg.actionExamples.split('\n')
  };
  ok = true;
  let rawdata = fs.readFileSync('assets/botFiles/actions.json');
  let actions = JSON.parse(rawdata);
  for(let i = 0; i < actions.length; i++){
    if (actions[i].name == obj.name) {
      ok = false;
    }
  }
  if (!ok) {
    return;
  }
  actions.push(obj);
  fs.writeFile('assets/botFiles/actions.json', JSON.stringify(actions, null, 2), (err) => {
    if (err)
      throw err;
  });
})

ipcMain.on('load-action', (event, arg)=> {
    console.log("load action");
})
