'use strict';
const {Docker} = require('node-docker-api');
const dockerode = require('dockerode');
const tar = require('tar-fs');
const { BrowserWindow, ipcMain, dialog } = require('electron')
const backend = require('./backend')
const fs = require('fs')
var net = require('net');
var request = require('request');
const ProgressBar = require('electron-progressbar');

var progressStart;
var progressStop;
var progressBuild;
var busyCtr = 0;
var busyMessage;
var is_server_on = false;

function update_server_status() {
	setTimeout(function(){
		request('http://localhost:5005/webhooks/rest', function (error, response, body) {
		  if (!error && response.statusCode == 200) {
				is_server_on = true;
				if (progressStart != null && progressStart.isInProgress()){
					progressStart.setCompleted();
					progressStart.close();
				}
				update_server_status();
		  } else {
				is_server_on = false;
				if (progressStop != null && progressStop.isInProgress()){
					progressStop.setCompleted();
					progressStop.close();
				}
				update_server_status();
			}
		});
	}, 1500);
}
update_server_status()

function release_on_run() {
	setTimeout(function(){
		if (is_server_on) {
			dialog.showMessageBox({
				type: 'info',
				message: 'Done!',
				buttons: ['Ok']
			});
			free_lock(2);
		} else {
			if(busyCtr == 2) {
				release_on_run();
			}
		}
	},250);
}

function release_on_stop() {
	setTimeout(function(){
		if (is_server_on) {
			if(busyCtr == 2) {
				release_on_stop();
			}
		} else {
			dialog.showMessageBox({
				type: 'info',
				message: 'Done!',
				buttons: ['Ok']
			});
			free_lock(2);
		}
	},250);
}

function acquire_lock(busyMsg) {
  if(busyCtr != 0) {
  	console.log(busyMessage);
	dialog.showErrorBox('Oops.. ', 'Please wait "' + busyMessage + '" currently running.');
  	return false;
  }
  busyCtr = 2;
  busyMessage = busyMsg;
  return true;
}

function free_lock(num) {
	busyCtr -= num;
}

ipcMain.on('validate-my-model', async (event, arg)=> {

	if(!acquire_lock("validation")) {
		return;
	}

	let errors = backend.full_validation();
	dialog.showMessageBox({
		type: 'info',
		message: 'Your models have ' + errors.length + ' errors!',
		buttons: ['Ok']
	});
	event.sender.send('model-validated', errors);

	free_lock(2);

})

ipcMain.on('start-my-model', (event, arg)=> {

	//if already started!
	if(is_server_on == true) {
		dialog.showMessageBox({
			type: 'info',
			message: 'Server is already running!',
			buttons: ['Ok']
		});
		return;
	}

	if(!acquire_lock("starting model")) {
		return;
	}

	progressStart = new ProgressBar({
    text: 'Starting server...',
    detail: 'Please wait...',
		browserWindow: {parent: BrowserWindow.getAllWindows()[0]}
  });

	/////// Used to start the server of the bot, check for port 5005 afterwards to know that it has started
	var drode = new dockerode({socketPath: '/var/run/docker.sock'});
	drode.run('testbot_1', [], process.stdout, {
		Env : ["PORT=5005", "PYTHONPATH=/app/:$PYTHONPATH"],
	  ExposedPorts: {
	    '5005/tcp': {}
	  },
	  Hostconfig: {
	    PortBindings: {
	      '5005/tcp': [{
	        HostPort: '5005',
	      }],
	    },
	  },
	})
	.then(() => {
		console.log("Terminated");
	})
	.catch(error => {
		console.log(error);
		progressStart.close();
		dialog.showMessageBox({
			type: 'info',
			message: 'error! : ' + error,
			buttons: ['Ok']
		});
		free_lock(2);
	});

	release_on_run();

})

ipcMain.on('build-my-model', (event, arg)=> {

	//if already started!
	if(is_server_on == true) {
		dialog.showMessageBox({
			type: 'info',
			message: 'Server is running, you must stop it first!',
			buttons: ['Ok']
		});
		return;
	}

	if(!acquire_lock("building model")) {
		return;
	}


	//validate & convert data
	let data_error_free = backend.full_conversion();
	if(data_error_free === false) {
		dialog.showMessageBox({
			type: 'info',
			message: 'Your models have errors! please fix them first!',
			buttons: ['Ok']
		});
		free_lock(2);
		return;
	}
	//write to backend file
	fs.writeFile("backend/data.json", data_error_free, (err) => {
		if (err) {
			dialog.showErrorBox('Oops.. ', 'Something went wrong');
			free_lock(2);
			return;
		}
	});

	progressBuild = new ProgressBar({
    text: 'Building...',
    detail: 'Please wait while your Bot is being built and trained...',
		browserWindow: {parent: BrowserWindow.getAllWindows()[0]}
  });
	var err = false;
	/////////// Used to build and train bot docker image, inside the first then() block, you can know that build has finished
	const promisifyStream = stream => new Promise((resolve, reject) => {
	  stream.on('data', data => {
			var log = data.toString().trim().split("\r\n");
			for (var i = 0; i < log.length; i++){
				console.log(JSON.parse(log[i]));
				if (JSON.parse(log[i]).hasOwnProperty("errorDetail")){
					err = true;
				}
			}
			// console.log('{"stream":"Step 1/22 : FROM ubuntu:18.04"}');
		})
	  stream.on('end', resolve)
	  stream.on('error', reject)
	});

	const docker = new Docker({ socketPath: '/var/run/docker.sock' });

	var tarStream = tar.pack('./backend');
	docker.image.build(tarStream, {
	  t: 'testbot_1'
	})
	.then(stream => promisifyStream(stream))
	.then(() => {
		if (progressBuild != null && progressBuild.isInProgress()){
			progressBuild.setCompleted();
			progressBuild.close();
		}
		console.log(docker.image.get('testbot_1').status());
		if (err){
			dialog.showMessageBox({
				type: 'info',
				message: 'error! : There was a problem building your bot. Please validate your data and try again',
				buttons: ['Ok']
			});
		} else {
			dialog.showMessageBox({
				type: 'info',
				message: 'Done!',
				buttons: ['Ok']
			});
		}
		free_lock(2);
	})
	.catch(error => {
		console.log(error);
		progressBuild.close();
		dialog.showMessageBox({
			type: 'info',
			message: 'error! : ' + error,
			buttons: ['Ok']
		});
		free_lock(2);
	});

})


ipcMain.on('stop-my-model', (event, arg)=> {

	//if already stopped!
	if(is_server_on == false) {
		dialog.showMessageBox({
			type: 'info',
			message: 'Server is already stopped!',
			buttons: ['Ok']
		});
		return;
	}

	if(!acquire_lock("stopping model")) {
		return;
	}

	progressStop = new ProgressBar({
    text: 'Stopping server...',
    detail: 'Please wait...',
		browserWindow: {parent: BrowserWindow.getAllWindows()[0]}
  });

	//////// Used to stop all containers, check for port 5005 until nothing is listening to know that everything was stopped.
	var drode = new dockerode({socketPath: '/var/run/docker.sock'});
	drode.listContainers(function (err, containers) {
		containers.forEach(function (containerInfo) {
			drode.getContainer(containerInfo.Id).stop();
		});
	});

	release_on_stop();

})

ipcMain.on('start-example-model', (event, arg)=> {

	var docker = new dockerode({socketPath: '/var/run/docker.sock'});
	function handler(err, stream) {

     stream.pipe(process.stdout, {
      end: true
    });

     stream.on('end', function() {
      done();
    });
  }
  var data = require('fs').createReadStream('./serene_boyd.zip');
  docker.importImage(data, handler);
	return;

	//if already started!
	if(is_server_on == true) {
		dialog.showMessageBox({
			type: 'info',
			message: 'Server is already running!',
			buttons: ['Ok']
		});
		return;
	}

	if(!acquire_lock("starting example model")) {
		return;
	}

	progressStart = new ProgressBar({
    text: 'Starting server...',
    detail: 'Please wait...',
		browserWindow: {parent: BrowserWindow.getAllWindows()[0]}
  });

	/////// Used to start the server of the bot, check for port 5005 afterwards to know that it has started
	var drode = new dockerode({socketPath: '/var/run/docker.sock'});
	drode.run('demobot', [], process.stdout, {
		Env : ["PORT=5005", "PYTHONPATH=/app/:$PYTHONPATH"],
	  ExposedPorts: {
	    '5005/tcp': {}
	  },
	  Hostconfig: {
	    PortBindings: {
	      '5005/tcp': [{
	        HostPort: '5005',
	      }],
	    },
	  },
	})
	.then(() => {
		console.log("Terminated");
	})
	.catch(error => {
		console.log(error);
		progressStart.close();
		dialog.showMessageBox({
			type: 'info',
			message: 'error! : ' + error,
			buttons: ['Ok']
		});
		free_lock(2);
	});

	release_on_run();

})

ipcMain.on('stop-example-model', (event, arg)=> {

	//if already stopped!
	if(is_server_on == false) {
		dialog.showMessageBox({
			type: 'info',
			message: 'Server is already stopped!',
			buttons: ['Ok']
		});
		return;
	}

	if(!acquire_lock("stopping model")) {
		return;
	}

	progressStop = new ProgressBar({
    text: 'Stopping server...',
    detail: 'Please wait...',
		browserWindow: {parent: BrowserWindow.getAllWindows()[0]}
  });

	//////// Used to stop all containers, check for port 5005 until nothing is listening to know that everything was stopped.
	var drode = new dockerode({socketPath: '/var/run/docker.sock'});
	drode.listContainers(function (err, containers) {
		containers.forEach(function (containerInfo) {
			drode.getContainer(containerInfo.Id).stop();
		});
	});

	release_on_stop();

})
