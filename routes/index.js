/* function setRouter(router)
{ */
const express=require('express')
var router=express.Router()
const {ipcRenderer,remote} = require('electron')
const fs = require('fs')
var process = require('process');
const path = require('path')
const DBApi =  require('db-apis')//操作mongodb的api类 


//var audicable = require('../AudiCable addon/lib/audicable')
var audicable = require('audicable-addon')
//api
var AmazonApp=0
var iTunesApp=0
var iTunesLibrary=0
var SpotifyApp=0
var SpotifyLibrary=0
var Tool=0
var Player=0
var RecordApp=0
var SpotifyCMDApp=0
var RecordCMDApp=0
var APP_INFO = remote.getGlobal('appInfo')//app信息形如{appData:"d:\\work",name:"record"}
APP_INFO.appData="D:\\work\\DB"
var PID = remote.getGlobal('pid')
var CONFIGS = remote.getGlobal('configs')
console.log('APP_INFO',APP_INFO)
console.log('PID',PID)
console.log('CONFIGS',CONFIGS)
var CONFIG_PATH = path.join(APP_INFO.appData,"config.json")//配置文件路径
var SOURCES={}
//储存记录
var RECORDS={}
//记录配置
var RECORDS_CONFIG={}
//当前歌曲信息
var CUR_MUSIC_INFO={
	"error":true,
	"errorCode":-1
}






//闰年、平年的每月天数
var NORMAL_MONTH_DAY=[31,28,31,30,31,30,31,31,30,31,30,31]
var LEAP_MONTH_DAY=[31,29,31,30,31,30,31,31,30,31,30,31]
//获取某年某月的秒数
function getSecondsOfMonth(year,month)
{
	if (year%4==0&&year%100!=0 || year%400==0)
		return LEAP_MONTH_DAY[month-1]*60*60*24
	else
		return NORMAL_MONTH_DAY[month-1]*60*60*24
}
//获取一年的秒数
function getSecondsOfYear(year)
{
	if (year%4==0&&year%100!=0 || year%400==0)
		return 60*60*24*366
	else
		return 60*60*24*365
}
//将记录的文件名转化成日期字符串 形如:2021-06-04-155620==>2021-06-04 15:56:20
function getDateStr(date)
{	
	var time=date.slice(11)
	var date=date.slice(0,10)
	var rs=[]
	for(var i=0;i+2<=time.length;i+=2)
	{
		var tmp=time.slice(i,i+2)
		rs.push(tmp)
		if (i+2<time.length)
			rs.push(":")
	}
	
	return date+' '+rs.join('')
}
//将秒数转化成时间字符串 形如:100==>00:01:40
function secondsToTimeStr(seconds)
{
	var hour=parseInt(seconds/3600%99)
	var minute=parseInt(seconds/60%60)
	var second=parseInt(seconds%60)
	var hourStr=(Array(2).join(0) + hour).slice(-2);
	var minuteStr=(Array(2).join(0) + minute).slice(-2);
	var secondStr=(Array(2).join(0) + second).slice(-2);
	return hourStr+":"+minuteStr+":"+secondStr
}

//***********websocket方式**************
//返回当前录音歌曲的数据
router.websocket('/getSoundMessage',function(info,cb,next){
	function getSoundMessage(socket){
		//设置定时器发送数据
		setInterval(function(){
			  socket.send(JSON.stringify(CUR_MUSIC_INFO))
		},1000)
	}
	cb(getSoundMessage)
});
//***************http方式******************
//首页
router.get('/', function(req, res, next) {
    res.send('hello!')
});
//初始化模块
router.post('/Init',function(req,res,next){
	if (APP_INFO==null)
	{
		var rs={error:true,errorCode:-1}
		console.log("Init获取appInfo失败",rs)
		res.send(rs)
		return 
	}
	//对网站列表数据进行初始化
	var api = new DBApi(APP_INFO)
	api.execute('RPDB.writeDefaultPlatforms').then(r=>{
		//生成配置文件config.json
		var logfile=path.join(APP_INFO.appData, 'Logs')
		var tempPath=CONFIGS.get('tempPath')
		var outputFolder=APP_INFO.appDocuments
		var formatOutputFolder=path.join(APP_INFO.appDocuments,"FormatConverter")
		var defaultConfig={
			"language": "en",
			"skipVersion": [
				"1.2.1"
			],
			"appInfo": APP_INFO,
			"logfile": logfile,
			"tempPath": tempPath,
			"outputFormat": "mp3",
			"conversionMode": "auto",
			"outputQuality": 128,
			"covertSpeed": 2,
			"outputFolder": "D:\\tmp",
			"protocol": "No Proxy",
			"proxy": "",
			"port": "",
			"afterCT": "Do nothing",
			"appColor": "dark",
			"adFilter": 30,
			"formatOutputFolder": formatOutputFolder,
			"outputOrganized": "Artist/Album",
			"filenameRule": "{Track Number} {Title}",
			"renameExistFile": true,
			"recordedCount": -9996,
			"showInstallGuide": "12.0.7",
			"autoStop": false,
			"autoStopAfter": 3600,
			"isTrial": true,
			"splitSilenceTime": 180,
			"splitType": "silence"
		}
		console.log('CONFIG_PATH',CONFIG_PATH)
		console.log('defaultConfig',defaultConfig)
		if (fs.existsSync(CONFIG_PATH))
		{
			var data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
			data.appInfo = defaultConfig.appInfo
			data.logfile = defaultConfig.logfile
			data.tempPath = defaultConfig.tempPath
			fs.writeFileSync(CONFIG_PATH,JSON.stringify(data), 'utf-8')
		}
		else{
			fs.writeFileSync(CONFIG_PATH,JSON.stringify(defaultConfig), 'utf-8')
		}
		//底层audicable音频库初始化
		//var opData=new Object(req.body.opData)
		// var appTempPath = configs.get('tempPath')
		// var logPath = path.join(appInfo.appData, 'Logs')
		var opData={
			"appTempPath":CONFIGS.get('tempPath'),
			"logPath": path.join(APP_INFO.appData, 'Logs'),
			"appName":APP_INFO.appName,
			"appIdentify":APP_INFO.appId,
			"pid":PID}
		console.log("Init.opData",opData)
		//const opData ={"appTempPath":"C:\\Users\\Admin\\AppData\\Local\\Temp\\AudiCable","logPath":"C:\\Users\\Admin\\AppData\\Roaming\\AudiCable\\Logs","appName":"AudiCable","appIdentify":"com.audicable.audiorecorder","pid":123}
		var rs=audicable.Initialize(JSON.stringify({opData}))
		//获取所有的接口
		AmazonApp=audicable.QueryInterface('MusicApp', JSON.stringify({ appType: 'amazon' }))
		iTunesApp=audicable.QueryInterface('MusicApp', JSON.stringify({ appType: 'itunes' }))
		iTunesLibrary=audicable.QueryInterface('MusicLibrary', JSON.stringify({ appType: 'itunes' }))
		SpotifyApp= audicable.QueryInterface('MusicApp', JSON.stringify({ appType: 'spotify' }))
		SpotifyLibrary=audicable.QueryInterface('MusicLibrary', JSON.stringify({ appType: 'spotify' }))
		Tool=audicable.QueryInterface('Tool', '')
		Player=audicable.QueryInterface('Player', '')
		RecordApp=audicable.QueryInterface('Record', '')
		SpotifyCMDApp=audicable.QueryInterface('CDMApp', JSON.stringify({ appType: 'spotify' }))
		RecordCMDApp=audicable.QueryInterface('CDMApp', JSON.stringify({ appType: 'record' }))
		console.log("Init",rs)
		res.send(rs);
	})//将文件数据写入mongodb中
	
});
//析构模块
router.get('/DeInit',function(req,res,next){
	const opData ={"appTempPath":"C:\\Users\\Admin\\AppData\\Local\\Temp\\AudiCable","logPath":"C:\\Users\\Admin\\AppData\\Roaming\\AudiCable\\Logs","appName":"AudiCable","appIdentify":"com.audicable.audiorecorder"}
	var rs=audicable.DeInitialize(JSON.stringify({opData}))
	console.log("DeInit",rs)
	res.send(rs);
});
//获取source列表(首页的所有平台数据)
router.post('/getSourceList',function(req,res,next){
	var api = new DBApi(APP_INFO)
	//读取mongodb的数据
	api.execute('RPDB.read').then(docs=>{
		console.log('RPDB.read',docs)
		if(docs)
		{
			var rs={
				error:false,
				errorCode:0,
				sources:docs
			}
			for (var doc of docs)
			{
				SOURCES[doc._id]=doc
			}
		}	
		else
			var rs={error:true,errorCode:-1}
		console.log("getSourceList",rs)
		res.send(rs)
	})
	
});

//修改source
router.post('/setSource',function(req,res,next){
	var sources = req.body.sources
	if (APP_INFO==null)
	{
		var rs={error:true,errorCode:-1}
		console.log("setSource,尝试先post请求getSourceList",rs)
		res.send(rs);
	}
	var api = new DBApi(APP_INFO)
	api.execute('RPDB.updateAll', sources).then(r=>{
		//r表示删除个数
		var rs={
			error:false,
			errorCode:0,
			sources:sources
		}
		console.log("setSource",rs)
		res.send(rs)

	})		
});
//录制配置
router.get('/getRecordList',function(req,res,next){
	if (APP_INFO==null)
	{
		var rs={error:true,errorCode:-1}
		console.log("getRecordList,尝试先post请求getSourceList",rs)
		res.send(rs);
	}
	var api=new DBApi(APP_INFO)
	api.execute("Library.read").then(r=>{
		var rs={
			error: false,
			errorCode: 0,
			records: r
		}
		console.log("getRecordList",rs)
		res.send(rs);
	})
});
//修改record
router.post('/setRecord',function(req,res,next){
	if (APP_INFO==null)
	{
		var rs={error:true,errorCode:-1}
		console.log("getRecordList,尝试先post请求getSourceList",rs)
		res.send(rs);
	}
	var api=new DBApi(APP_INFO)
	var record=req.body.record
	api.execute('Library.update',{_id:record._id},record).then(r=>{
		var rs={error:false,errorCode:0}
		console.log("setRecord",rs)
		res.send(rs)
	})

});
//删除record
router.post('/deleteRecord',function(req,res,next){
	if (APP_INFO==null)
	{
		var rs={error:true,errorCode:-1}
		console.log("getConvertedList,尝试先post请求getSourceList",rs)
		res.send(rs)
	}
	var api=new DBApi(APP_INFO)
	var records=req.body.records
	var _ids=[]
	for(var record of records)
	{
		_ids.push(record._id)
	}
	api.execute('Library.remove',{_id:{$in:_ids}}).then(r=>{
		var rs={error:false,errorCode:0,records:records}
		console.log("deleteRecord",rs)
		res.send(rs)
	})
});
//获取record分类
router.post('/getConvertedList',function(req,res,next){
	var way=req.body.way
	if (APP_INFO==null)
	{
		var rs={error:true,errorCode:-1}
		console.log("getConvertedList,尝试先post请求getSourceList",rs)
		res.send(rs);
	}
	var api=new DBApi(APP_INFO)
	api.execute('Library.read',true).then(r=>{
		var rs={
			error: false,
			errorCode: 0,
			convertedList:[]
		}
		switch (way)
		{
			case 'artist':
				//内存记录信息
				RECORDS['artist']=[r]
				rs.convertedList=[{
					  cid: 1,
					  name: 'All Converted',
					  count: r.length
					}]
				//记录歌手数据形如 {'张三':['我','你','他'],'李四':['春','秋']}
				var mem={}
				for(var record of r)
				{
					var artist=record.artist
					if(artist in mem)
						mem[artist].push(record)
					else
						mem[artist]=[record]
				}
				for(var key in mem)
				{
					var cid=rs.convertedList.length+1
					var name=key
					var count=mem[key].length
					RECORDS['artist'].push(mem[key])
					rs.convertedList.push({
						cid:cid,
						name:name,
						count:count
					})
				}
				break
			case 'time':
				//内存记录信息
				RECORDS['time']=[r,[],[],[],[]]
				rs.convertedList=[
					{
					  cid: 1,
					  name: 'All Time',
					  count: r.length
					},
					{
					  cid: 2,
					  name: 'Recent',
					  count: 0
					},
					{
					  cid: 3,
					  name: 'A week ago',
					  count: 0
					}
					,
					{
					  cid: 4,
					  name: 'A month ago',
					  count: 0
					}
					,
					{
					  cid: 5,
					  name: 'Half a year ago',
					  count: 0
					}
				]
				//当前时间
				var nowDate=new Date()
				if (r.length>0){
					for(var record of r)
					{
						//创建记录的date对象
						var dateList=record['recordingDate'].split(" ")[0].split("-")//时间形如 "recordingDate": "2021-10-02 09:23"
						var year=dateList[0]
						var month=dateList[1]
						var day=dateList[2]
						var recordDate=new Date()
						recordDate.setFullYear(year,month-1,day);
						if (nowDate.getTime()/1000-recordDate.getTime()/1000<=60*60*24*7)//最近一星期
						{
							rs.convertedList[1].count+=1
							RECORDS['time'][1].push(record)
						}
						else if (nowDate.getTime()/1000-recordDate.getTime()/1000>60*60*24*7 && nowDate.getTime()/1000-recordDate.getTime()/1000<=getSecondsOfMonth(year,month))//一星期前,一个月内
						{
							rs.convertedList[2].count+=1
							RECORDS['time'][2].push(record)
						}
						else if (nowDate.getTime()/1000-recordDate.getTime()/1000>getSecondsOfMonth(year,month) && nowDate.getTime()/1000-recordDate.getTime()/1000<getSecondsOfYear(year,month)/2)//一个月前,半年内
						{
							rs.convertedList[3].count+=1
							RECORDS['time'][3].push(record)
						}	
						else//半年前
						{
							rs.convertedList[4].count+=1
							RECORDS['time'][4].push(record)
						}	
					}
				}
				break
			case 'source':
				//内存记录信息
				RECORDS['source']=[r]
				rs.convertedList=[
					{
						cid:1,
						name:'All Source',
						count:r.length
					}
				]	
				//记录平台数据形如 {'Tidal':3,'appleMusic':4}
				var mem={}
				for(var record of r)
				{
					var musicType=record.musicType
					if(musicType in mem)
						mem[musicType].push(record)
					else
						mem[musicType]=[record]
				}
				for(var key in mem)
				{
					var cid=rs.convertedList.length+1
					var name=key
					var count=mem[key].length
					RECORDS['source'].push(mem[key])
					rs.convertedList.push({
						cid:cid,
						name:name,
						count:count
					})
				}
				break
		}
		console.log("getConvertedList",rs)
		res.send(rs);
	})
	
});
//根据分类修改录音列表
router.post('/setRecordListByConverted',function(req,res,next){
	var way=req.body.way
	var cid=req.body.cid
	var rs= {
		error: false,
		errorCode: 0,
		records: []
	}
	rs.records=RECORDS[way][cid-1]
	console.log("setRecordListByConverted",rs)
	res.send(rs);
});

//打开音乐平台
router.post('/openSource',function(req,res,next){
	const {app, BrowserWindow,shell,ipcMain} = require('electron')
	var _id=req.body._id
	console.log(_id,SOURCES)
	var url=SOURCES[_id].url
	var id=SOURCES[_id].name
	ipcRenderer.send('open', {"url":url,"id":id})
	var rs= {
	error: false,
	errorCode: 0,
	}
	console.log("openSource",rs)
	res.send(rs);
});
//获取打开的音乐平台的信息
router.get('/getRecordSource',function(req,res,next){
	var rs= {
	  error: false,
	  errorCode: 0,
	  source: {
		_id: 1,
		name: 'Spotify',
		src: 'spla_sp@2x.png',
		show: false,
		url: 'https://open.spotify.com/',
		custom: false,
		configShow: false
	  }
	}
	console.log("getRecordSource",rs)
	res.send(rs);
});
//关闭音乐平台
router.post('/closeSource',function(req,res,next){
	var rs= {
		error: false,
		errorCode: 0
    }
	ipcRenderer.send('close')
	console.log("closeSource",rs)
	res.send(rs);
});
//开始录音
router.post('/BeginListen',function(req,res,next){
	const jsonCMD={"opType":"BeginListen","opData":{}}
	var rs=audicable.Execute(RecordApp,JSON.stringify( jsonCMD ))
	console.log("BeginListen",JSON.parse(rs.Result))
	res.send(JSON.parse(rs.Result));
});
//暂停录音
router.post('/PauseListen',function(req,res,next){
	var data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
	const jsonCMD={"opType":"PauseListen","opData":{}}
	var rs=audicable.Execute(RecordApp,JSON.stringify( jsonCMD ))
	res.send(JSON.parse(rs.Result));
	console.log("PauseListen",JSON.parse(rs.Result))
});
//恢复录音
router.post('/ResumeListen',function(req,res,next){
	const jsonCMD={"opType":"ResumeListen","opData":{}}
	var rs=audicable.Execute(RecordApp,JSON.stringify( jsonCMD ))
	console.log("ResumeListen",JSON.parse(rs.Result))
	res.send(JSON.parse(rs.Result));
});
//记录并返回当前集成录音歌曲的数据
router.post('/sendWebviewMetaData',function(req,res,next){
	var tmp=audicable.GetCurMusicResult()
	var target=req.body.target
	try{
	   var tmp=JSON.parse(tmp)
	   var recordingDate=getDateStr(tmp.progress.recordId)//将记录id转化为日期字符
	   var error=tmp.error
	   if (!error)
	   {
		   var fullPath=path.join(RECORDS_CONFIG.folder,tmp.progress.recordId)+'.'+RECORDS_CONFIG.config.type
		   var rs={
			error: tmp.error,
			errorCode: 0,
			music: {
			  rid: tmp.progress.recordId,
			  duration: tmp.progress.duration,
			  recordingDate:recordingDate,
			  state:tmp.progress.state,
			  fullPath:fullPath,
			  'title': target.title,
			  'src': target.thumbnail,
			  'artist': target.artist,
			  'album': target.album,
			  '_id':0
			}
		   }
	   }  
	   else
		  var rs=tmp 
	}catch(e)
	{
	   console.warn('解析错误')
	   console.log('歌曲状态',tmp)
	   console.log('歌曲信息',target)
	   var rs={
		error:true,
		errorCode:-8
	   }
	}
	//记录歌曲信息 
	CUR_MUSIC_INFO=rs
	console.log("sendWebviewMetaData",rs)
	res.send(rs)
});
//返回当前录音歌曲的数据
router.get('/getSoundMessage',function(req,res,next){
	var tmp=audicable.GetCurMusicResult()
    try{
	   tmp=JSON.parse(tmp)
	   var recordingDate=getDateStr(tmp.progress.recordId)//将记录id转化为日期字符
	   var error=tmp.error
	   if (!error)
	   {
		   var fullPath=path.join(RECORDS_CONFIG.folder,tmp.progress.recordId)+'.'+RECORDS_CONFIG.config.type
		   var rs={
			error: tmp.error,
			errorCode: 0,
			music: {
			  rid: tmp.progress.recordId,
			  duration: tmp.progress.duration,
			  recordingDate:recordingDate,
			  state:tmp.progress.state,
			  fullPath:fullPath
			}
		   }
	   }  
	   else
		  var rs=tmp 
   }catch(e)
   {
	   console.warn('解析错误')
	   console.log('歌曲状态:',tmp)
	   var rs={
		error:true,
		errorCode:-8
	   }
   } 
   console.log("getSoundMessage",rs)
   res.send(rs)
});
//录制结束之后调用该接口 该接口返回本次录制的录音信息
router.post('/addRecord',function(req,res,next){
	if (APP_INFO==null)
	{
		var rs={error:true,errorCode:-1}
		console.log("getConvertedList,尝试先post请求getSourceList",rs)
		res.send(rs);
	}
	var api = new DBApi(APP_INFO)
	var record=req.body.record
	console.log(record)
	//var musicType=record.musicType
	var musicType='Unknown'
	var newRecord={
			title: record.title,
			src: record.src,
			artist: record.artist,
			album: record.album,
			duration: record.duration,
			recordingDate:record.recordingDate,
			genre: '',
			year: 0,
			TrackNum: 0,
			"musicType": musicType,
			fullPath: record.fullPath
		}
	var rs={
			error:false,
			errorCode:0,
			record:newRecord
		}
	//数据库添加数据
	api.execute("Library.write",newRecord)
    console.log("addRecord",rs)
    res.send(rs)
});
//开始播放 
router.post('/startPlay',function(req,res,next){
	var rs= {
    error: false,
    errorCode: 0,
	}
	console.log("startPlay",rs)
	res.send(rs);
});
//返回当前播放歌曲的数据 
router.get('/getRecordMessage',function(req,res,next){
	var rs= {
	  error: false,
	  errorCode: 0,
	  record: {
		rid: '1',
		title: "Marvel's The Avengers",
		src: 'default_s@2x.png',
		artist: 'Flying life',
		album: 'Flying life',
		duration: '00:05:12',
		recordingDate: '2021-10-02 09:23 AM',
		genre: '',
		year: 0,
		TrackNum: 0
	  }
	}
	console.log("getRecordMessage",rs)
	res.send(rs);
});
//暂停播放 
router.post('/stopPlay',function(req,res,next){
	var rs= {
    error: false,
    errorCode: 0,
	}
	console.log("stopPlay",rs)
	res.send(rs);
});
//暂停播放 
router.post('/continuePlay',function(req,res,next){
	var rs= {
    error: false,
    errorCode: 0,
	}
	console.log("continuePlay",rs)
	res.send(rs);
});
//获取录音设置(录音的界面 右上角的设置) 
router.get('/getRecordSetting',function(req,res,next){
	var rs= {
	  error: false,
	  errorCode: 0,
	  recordSetting: {
		config: {
		  bitRate: 128, // int 比特率
		  type: 'mp3' // string 类型
		},
		folder: 'D:\\tmp', // string 输出目录
		isTrial: 'true', // bool 是否测试, true:未注册版本, false:注册版本
		splitType: 'silence', // string, 分割规则, none:不分割, silence:静音分割, track:按track分割
		splitSilenceTime: 180, // int, 仅当splitType为silence时有该字段. 当静音多久后分割, 毫秒
		adFilter: 30, // int, 不保留录制时长低于, 等于多久的音频, 秒
		autoStop: false, // bool, 是否启用自动停止
		autoStopAfter: 3600 // optional, int, 仅当autoStop为true时有该字段, 多久后停止录制, 秒
	  }
	}
	console.log("getRecordSetting",rs)
	res.send(rs);
});
//修改录音设置
router.post('/setRecordSetting',function(req,res,next){
	
	var rs= {
	error: false,
	errorCode: 0,
	}
	console.log("setRecordSetting",rs)
	res.send(rs);
	
});
//获取输出设置
router.get('/getOutputSetting',function(req,res,next){
	if (fs.existsSync(CONFIG_PATH))
	{
		var data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
		console.log('getOutputSetting获取配置数据',data)
		var bitRate=parseInt(data.outputQuality)
		var type=data.outputFormat
		var folder=data.outputFolder
		var isTrial=data.isTrial
		var splitType=data.splitType
		var splitSilenceTime=data.splitSilenceTime
		var adFilter=data.adFilter
		var autoStop=data.autoStop
		var autoStopAfter=data.autoStopAfter
		var outputSetting={
			"opType": "UpdateRecordConfig",
			"opData": {
				"config": {
					"bitRate": bitRate,
					"type": type,
				},
				"folder": folder,
				"isTrial": isTrial,
				"splitType": splitType,
				"splitSilenceTime": splitSilenceTime,
				"adFilter": adFilter,
				"autoStop": autoStop,
				"autoStopAfter": autoStopAfter,
			}
		}
		var rs= {
		  error: false,
		  errorCode: 0,
		  outputSetting: outputSetting
		}
		console.log("getOutputSetting",rs)
		res.send(rs);
	}
	else
	{
		var rs= {error: true,errorCode: -1}
		res.send(rs)
	}
	
	
});
//修改输出设置
router.post('/setOutputSetting',function(req,res,next){
	if (fs.existsSync(CONFIG_PATH))
	{
		var jsonCMD=req.body.setting//形如/getOutputSetting的outputSetting
		console.log(jsonCMD)
		RECORDS_CONFIG=jsonCMD.opData
		var data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
		data.adFilter=RECORDS_CONFIG.adFilter
		data.autoStop=RECORDS_CONFIG.autoStop
		data.autoStopAfter=RECORDS_CONFIG.autoStopAfter
		data.outputQuality=RECORDS_CONFIG.config.bitRate
		data.outputFormat=RECORDS_CONFIG.config.type
		data.outputFolder=RECORDS_CONFIG.folder
		data.isTrial=RECORDS_CONFIG.isTrial
		data.splitSilenceTime=RECORDS_CONFIG.splitSilenceTime
		data.splitType=RECORDS_CONFIG.splitType
		console.log('setOutputSetting配置数据',data)
		fs.writeFileSync(CONFIG_PATH,JSON.stringify(data),'utf-8')
		var rs=audicable.Execute(RecordApp,JSON.stringify( jsonCMD ))
		console.log("setOutputSetting",JSON.parse(rs.Result))
		res.send(JSON.parse(rs.Result));
	}
	else
	{
		var rs= {error: true,errorCode: -1}
		res.send(rs)
	}	

	/* var setting=req.body.setting
	console.log('setting',setting,'setting类型',typeof(setting))
	var jsonCMD ={
	"opType":"UpdateRecordConfig",
	"opData":{"config": {"bitRate": 128,"type":"mp3",},"folder": "D:\\tmp","isTrial":true,"splitType": "silence","splitSilenceTime": 180, "adFilter": 30,"autoStop": false,"autoStopAfter": 3600,}
	}
	console.log('jsonCMD',jsonCMD,'jsonCMD类型',typeof(jsonCMD))
	RECORDS_CONFIG=jsonCMD.opData
	console.log('setting转字符串',JSON.stringify(setting))
	console.log('jsonCMD转字符串',JSON.stringify(jsonCMD))

	var rs=audicable.Execute(RecordApp,JSON.stringify( setting ))
	console.log("setOutputSetting",JSON.parse(rs.Result))
	res.send(JSON.parse(rs.Result)); */
});
//最小化窗口
router.post('/window-min',function(req,res,next){
	ipcRenderer.send('window-min')
	var rs= {error: false,errorCode: 0}
	console.log("window-min",rs)
	res.send()
})
//最大化窗口
router.post('/window-max',function(req,res,next){
	ipcRenderer.send('window-max')
	var rs= {error: false,errorCode: 0}
	console.log("window-max",rs)
	res.send()
})
//关闭窗口
router.post('/window-close',function(req,res,next){
	ipcRenderer.send('window-close')
	var rs= {error: false,errorCode: 0}
	console.log("window-close",rs)
	res.send()
})
module.exports = router;