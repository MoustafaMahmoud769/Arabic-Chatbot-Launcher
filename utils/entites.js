const { ipcMain } = require('electron')
var fs = require('fs')

ipcMain.on('add-entity', (event, arg)=> {
  var obj = {
    name: arg.entityName,
    examples: arg.entityExamples.split('\n')
  };
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
