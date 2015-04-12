var http = require("http");
var url = require("url");
var actions = require("./actions");

map = actions.map;
function dispatch(request, response){
	var data = "";
	var path = url.parse(request.url).pathname;

	// data and end events are from net http://nodejs.org/api/net.html#net_event_data
	request.addListener("data", function(chunk){
		data += chunk;
	});
	request.addListener("end", function(){
		//RESUful
		if(path in map){
			map[path](data, response);
		}else{
			map["/error"](path, response);
		}
	});
}
http.createServer(dispatch).listen(3000);
