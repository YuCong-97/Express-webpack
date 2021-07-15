var path = require('path');
var express = require('express');
var bodyParser = require('body-parser')
const cors = require('cors');
var app = require('express-ws-routes')();
var indexRouter = require('./routes/index');



var path = require('path');
const args=process.argv.slice(2)//获取参数列表
var net = require('net')



app.use(cors()); //不加上这句代码跨域访问时会出现错误
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
app.use('/', indexRouter);
//app.use('/users', usersRouter);



// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});





function runServer (port = 3000){
	console.log(__dirname)
	return new Promise((resolve, reject) => {
		// 创建服务并监听该端口
		var server = net.createServer().listen(port)
		server.on('listening', function () { // 执行这块代码说明端口未被占用
			server.close() // 关闭服务
			console.log('The port【' + port + '】 is available.') // 控制台输出信息
			var exprssServer=app.listen(port, () => {
				console.log(`Example app listening at http://localhost:${port}`)
				resolve(port)//发送端口
			})
			exprssServer.wsServer.on('connection', function(socket) {
				console.log('connection to %s', socket.upgradeReq.url);
			});
		})
		server.on('error', function (err) {
			if (err.code === 'EADDRINUSE') { // 端口已经被使用
				console.log('The port【' + port + '】 is occupied')
				runServer(port+1)
				resolve()
			}
		})
	})
	
}


//启动服务器
if (args.length<1)
{
	console.log("用法:node %s  端口号",process.argv[1]);
}
else
{
	var port=args[0]//获取端口号
	// 创建服务并监听该端口
	runServer(Number(port))
}
