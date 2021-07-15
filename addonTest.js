var audicable=require("audicable-addon")
const opData ={"appTempPath":"C:\\Users\\Admin\\AppData\\Local\\Temp\\AudiCable","logPath":"C:\\Users\\Admin\\AppData\\Roaming\\AudiCable\\Logs","appName":"AudiCable","appIdentify":"com.audicable.audiorecorder","pid":25696}
audicable.Initialize(JSON.stringify({ opData }))


const AmazonApp=audicable.QueryInterface('MusicApp', JSON.stringify({ appType: 'amazon' }))
const iTunesApp=audicable.QueryInterface('MusicApp', JSON.stringify({ appType: 'itunes' }))
const iTunesLibrary=audicable.QueryInterface('MusicLibrary', JSON.stringify({ appType: 'itunes' }))
const SpotifyApp= audicable.QueryInterface('MusicApp', JSON.stringify({ appType: 'spotify' }))
const SpotifyLibrary=audicable.QueryInterface('MusicLibrary', JSON.stringify({ appType: 'spotify' }))
const Tool=audicable.QueryInterface('Tool', '')
const Player=audicable.QueryInterface('Player', '')
const RecordApp=audicable.QueryInterface('Record', '')
const SpotifyCMDApp=audicable.QueryInterface('CDMApp', JSON.stringify({ appType: 'spotify' }))
const RecordCMDApp=audicable.QueryInterface('CDMApp', JSON.stringify({ appType: 'record' }))
console.log("AmazonApp",AmazonApp)
console.log("iTunesApp",iTunesApp)
console.log("iTunesLibrary",iTunesLibrary)
console.log("SpotifyApp",SpotifyApp)
console.log("SpotifyLibrary",SpotifyLibrary)
console.log("Tool",Tool)
console.log("Player",Player)
console.log("RecordApp",RecordApp)
console.log("SpotifyCMDApp",SpotifyCMDApp)
console.log("RecordCMDApp",RecordCMDApp)
var jsonCMD ={
	"opType":"UpdateRecordConfig",
	"opData":{"config": {"bitRate": 128,"type":"mp3",},"folder": "D:\\work","isTrial":true,"splitType": "silence","splitSilenceTime": 180, "adFilter": 30,"autoStop": false,"autoStopAfter": 3600,}
}


var obj=audicable.Execute(RecordApp,JSON.stringify( jsonCMD ))
console.log("UpdateRecordConfig",obj)
jsonCMD={
		"opType":"BeginListen",	
		"opData":{
		}
}
obj=audicable.Execute(RecordApp,JSON.stringify( jsonCMD ))
console.log("BeginListen",obj)

obj=audicable.GetCurMusicResult()
console.log("GetCurMusicResult",obj)

jsonCMD={
		"opType":"PauseListen",	
		"opData":{
		}
}
obj=audicable.Execute(RecordApp,JSON.stringify( jsonCMD ))
console.log("PauseListen",obj)
jsonCMD={
		"opType":"ResumeListen",	
		"opData":{
		}
}
obj=audicable.Execute(RecordApp,JSON.stringify( jsonCMD ))
console.log("ResumeListen",obj)

//audicable.AbortExecute(interFace,taskId)
obj={'appPath': "C:\\Users\\Admin\\AppData\\Local\\Temp\\AudiCable" }
audicable.DeInitialize(JSON.stringify({ obj }))
