const { ipcMain } = require('electron')
var fs = require('fs')

ipcMain.on('add-story', (event, arg)=> {
  var obj = {
    name: arg.storyName,
    body: arg.storyBody.split('\n')
  };
  ok = true;
  let rawdata = fs.readFileSync('assets/botFiles/stories.json');
  let stories = JSON.parse(rawdata);
  for(let i = 0; i < stories.length; i++){
    if (stories[i].name == obj.name) {
      ok = false;
    }
  }
  if (!ok) {
    return;
  }
  stories.push(obj);
  fs.writeFile('assets/botFiles/stories.json', JSON.stringify(stories, null, 2), (err) => {
    if (err)
      throw err;
  });
})

ipcMain.on('load-story', (event, arg)=> {
    console.log("load story");
})
