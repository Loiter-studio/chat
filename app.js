var io = require('socket.io').listen(3000);

var dbUrl = 'mongodb://localhost/chats_dev';
var mongoskin = require('mongoskin');
var noop = function () {};
var db = mongoskin.db(dbUrl);
db.bind('chats');
db.bind('secret');
db.chats.ensureIndex({ finished: 1 }, noop);
db.secret.ensureIndex({ finished: 1 }, noop);

io.sockets.on('connection', function (socket) {
	socket.on('chat-request', function (data){
		db.chats.findOne({ user_id: data.user_id },
			function (err, _data) {
				socket.emit('chat-response', {code: "success", history: _data});
			}
		);
	});
	
	socket.on('chat-send-request', function(data){
		if(data.message == "")
			socket.emit('chat-send-response', {code: "failed"});
			
		var time = new Date().getTime();
		var rt_obj = {};
		rt_obj[time] = data.message;
		
		var content = {};		
		db.chats.findOne({ user_id: data.user_id, fellow_id: data.fellow_id },
			function (err, _data) {
				if(_data){
					content = _data.content;	// Restore previous message;
					content[time] = data.message;		
					
					db.chats.update({user_id: data.user_id, fellow_id: data.fellow_id}, {$set : {content: content} , $inc: {new:1}},true,false );
					socket.emit('chat-response', {code: "success", message: rt_obj });
				}
				else {
					content[time] = data.message;
					db.chats.save({
							user_id: data.user_id,
							fellow_id: data.fellow_id,
							content: content,
							new: 1,
						},
						function(err, row) {
							if(err) socket.emit('chat-send-response', {code: "failed"});
							else {
								socket.emit('chat-send-response', {code: "success", message: rt_obj });
							}
						}
					);
				}
			}
		);
	});
	
	
	console.log('twt');
	
	db.chats.find({user_id:"2"}, {content: {$slice: 1}}).toArray(function(err, data){
		console.log(data);
	});
	
	/*
	socket.on('chat-status-request', function(data){
		db.chats.find({}, function(err, data){
			console.log(data);
		});
	});
	
	socket.on('chat-new-request', function(data){
		db.chats.findOne({user_id: data.user_id, new: {$gt: 1}}, 
			function(err, _data){
				console.log(_data);
			}
		);
	});
	
	/*
  socket.on('login-request', function (data) {
		db.users.findOne({ username: data.username, password: data.password }, 
			function (err, _data) {
				console.log(_data);
				socket.emit('login-reply', _data.session);
			}
		);
	});
	
	socket.on('content-fetch-request', function(data){
	//	应该给每个用户一个sessionkey保存更新时间，以便决定怎么推送。再说吧。
		db.cardu.find({startTime:{"$gt":data.updateTime}}).toArray(function(err, items){
			console.log(data.updateTime);
			socket.emit('content-recieve', { 
				items: items
			});
		})
	});
	
	socket.on('register-verify-request', function(data){
		db.users.findOne({ username: data.username }, function(err, _data){
			if(_data == null) {
				var session = md5(data.username+data.password+new Date());
				db.users.save({username: data.username, password: data.password, session: session}, function (err, row) {
					if (err) {
						socket.emit("register-verify-reply", {code: "failed"});
					}
					else {
						socket.emit("login-reply", session);
					}
				});
			}
			else {
				socket.emit("register-verify-reply", {code: "failed"});
			}
		});
	});
	
	socket.on('register-request', function(data){
		console.log(data);
	});
	*/
});