const { ipcMain, dialog } = require('electron')
const backend = require('./backend')
const fs = require('fs')
const shell = require('shelljs');

function preprocess() {
  //launch backend
	node = shell.which('node')
	nodejs = shell.which('nodejs')
	if (node !== null && typeof node === "string")
	{
		shell.config.execPath = node;
	}
	else if (nodejs !== null && typeof nodejs === "string")
	{
		shell.config.execPath = nodejs;
	}
	else if(node !== null && typeof node['stdout'] === "string")
	{
		shell.config.execPath = node['stdout']
	}
	else if (nodejs !== null && typeof nodejs['stdout'] === "string")
	{
		shell.config.execPath = nodejs['stdout']
	}
	else
	{
		dialog.showErrorBox('Oops.. ', 'Can\'t fine node binary in your system');
		return;
	}
	dialog.showMessageBox({
		type: 'info',
		message: 'Running your model!',
		buttons: ['Ok']
	});
}

ipcMain.on('validate-my-model', (event, arg)=> {
    errors = backend.full_validation();
	dialog.showMessageBox({
		type: 'info',
		message: 'Your models have ' + errors.length + ' errors!',
		buttons: ['Ok']
	});
})

ipcMain.on('launch-my-model', (event, arg)=> {
	//validate & convert data
	data_error_free = backend.full_conversion();
	if(data_error_free === false) {
		dialog.showMessageBox({
			type: 'info',
			message: 'Your models have errors! please fix them first!',
			buttons: ['Ok']
		});
		return;
	}
	//write to backend file
	fs.writeFile("backend/data.json", data_error_free, (err) => {
		if (err) {
			dialog.showErrorBox('Oops.. ', 'Something went wrong');
			return;
		}
	});
	preprocess();
	shell.exec('backend/make_bot.sh SuperDuperBot', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		dialog.showMessageBox({
			type: 'info',
			message: 'Done! : ' + stdout,
			buttons: ['Ok']
		});
	});
})

ipcMain.on('start-example-model', (event, arg)=> {
  preprocess();
  shell.exec('backend/start_bot.sh AR-Trakhees-Demo', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		dialog.showMessageBox({
			type: 'info',
			message: 'Done! : ' + stdout,
			buttons: ['Ok']
		});
	});
})

ipcMain.on('stop-example-model', (event, arg)=> {
  preprocess();
  shell.exec('backend/stop_bot.sh', function(code, stdout, stderr) {
		console.log('Exit code:', code);
		console.log('Program output:', stdout);
		console.log('Program stderr:', stderr);
		dialog.showMessageBox({
			type: 'info',
			message: 'Done! : ' + stdout,
			buttons: ['Ok']
		});
	});
})
