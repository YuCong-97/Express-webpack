const API =  require('db-apis')
var appInfo={
	brand: 'AudiCable',
	appId: 'com.audicable.audiorecorder',
	name: 'AudiCable',
	appName: 'AudiCable',
	mainApp: 'recorder-refactor',
	version: '1.1.0',
	appData: 'D:\\work\\express-webpack\\DB',
	appDocuments: 'C:\\Users\\Admin\\Documents\\AudiCable',
	nativePath: 'D:\\work\\lrm client new\\native\\win32',
	resourcePath: 'static/resource',
	appConfigPath: 'static\\resource\\win32\\app.json'
}

var rAPI = new API(appInfo)
rAPI.execute('RPDB.writeDefaultPlatforms').then(r => {
   console.log('更新标签',r)
})
rAPI.execute('RPDB.read').then(r=>{
	console.log("读取数据库数据",r)
})
/* var record={"platform":"Tidal","id":"2021-06-02-091413","title":"2021-06-02-091413","duration":30,"path":"C:\\Users\\Admin\\Documents\\AudiCable\\2021-06-02-091413.m4a","date":1622596453695}
rAPI.execute('Library.write',record) */