const WebSocket = require('ws');
//Init
var ws = new WebSocket('ws://localhost:3000/Init');
const opData ={"appTempPath":"C:\\Users\\Admin\\AppData\\Local\\Temp\\AudiCable","logPath":"C:\\Users\\Admin\\AppData\\Roaming\\AudiCable\\Logs","appName":"AudiCable","appIdentify":"com.audicable.audiorecorder"}
ws.on('open', function open() {
  ws.send(JSON.stringify({opData}));
});

ws.on('message', function incoming(data) {
  console.log(data);
  ws.close()
});

//setOutputSetting
function setOutputSetting()
{
	ws = new WebSocket('ws://localhost:3000/setOutputSetting');
	const jsonCMD ={
		"opType": "UpdateRecordConfig",
		"opData": {
			"config": {
				"bitRate": 128,
				"type": "mp3"
			},
			"folder": "D:\\tmp",
			"isTrial": true,
			"splitType": "silence",
			"splitSilenceTime": 180,
			"adFilter": 30,
			"autoStop": false,
			"autoStopAfter": 3600
		}
	}
	ws.on('open', function open() {
	  ws.send(JSON.stringify(jsonCMD));
	});
	ws.on('message', function incoming(data) {
	  console.log(data);
	  ws.close()
	});
}
setTimeout(setOutputSetting,1000)
//getRecordList
function getRecordList()
{
	ws = new WebSocket('ws://localhost:3000/getSoundMessage');
	ws.on('open', function open() {
	  ws.send("");
	});
	ws.on('message', function incoming(data) {
	  console.log(data);
	  ws.close()
	});
}
setTimeout(getRecordList,2000)
