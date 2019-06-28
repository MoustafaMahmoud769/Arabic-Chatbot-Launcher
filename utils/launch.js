'use strict';
const {Docker} = require('node-docker-api');
const dockerode = require('dockerode');
const tar = require('tar-fs');
const { ipcMain, dialog } = require('electron')
const backend = require('./backend')
const fs = require('fs')
var net = require('net');

var busyCtr = 0;
var busyMessage;
var is_server_on = false;

function checkConnection(host, port, timeout) {
    return new Promise(function(resolve, reject) {
        timeout = timeout || 1000;     // default of 1 seconds
        var timer = setTimeout(function() {
            reject("timeout");
			if (socket != null){
				socket.end();
			}
        }, timeout);
        var socket = net.createConnection(port, host, function() {
            clearTimeout(timer);
            resolve();
            socket.end();
        });
        socket.on('error', function(err) {
            clearTimeout(timer);
            reject(err);
        });
    });
}

function update_server_status() {
	setTimeout(function(){
		checkConnection("127.0.0.1", 5005, 500).then(function() {
			is_server_on = true;
			update_server_status();
		}, function(err) {
			is_server_on = false;
			update_server_status();
		})
	},250);
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
		console.log("Ran");
	})
	.catch(error => {
		console.log(error);
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

	/////////// Used to build and train bot docker image, inside the first then() block, you can know that build has finished
	const promisifyStream = stream => new Promise((resolve, reject) => {
	  stream.on('data', data => console.log(data.toString()))
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
		console.log("BUILT");
		console.log(docker.image.get('testbot_1').status());
		dialog.showMessageBox({
			type: 'info',
			message: 'Done!',
			buttons: ['Ok']
		});
		free_lock(2);
	})
	.catch(error => {
		console.log(error);
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
		console.log("Ran");
	})
	.catch(error => {
		console.log(error);
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

	//////// Used to stop all containers, check for port 5005 until nothing is listening to know that everything was stopped.
	var drode = new dockerode({socketPath: '/var/run/docker.sock'});
	drode.listContainers(function (err, containers) {
		containers.forEach(function (containerInfo) {
			drode.getContainer(containerInfo.Id).stop();
		});
	});

	release_on_stop();

})
