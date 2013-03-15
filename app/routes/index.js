var https = require("https");

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.getVideos = function(req, res){
	var apiKey = "AIzaSyC_DETaU_Zpv5jwG5FzpwqxVQqWoPYrHgw",
		options = {
			hostname: "gdata.youtube.com",
			path: "/feeds/api/videos?q=arsenal&orderby=relevance&v=2&alt=json&max-results=2&key="+apiKey
		},
		ytReq = https.request(options, function(ytRes){
			// console.log('STATUS: ' + ytRes.statusCode);
			// console.log('HEADERS: ' + JSON.stringify(ytRes.headers));
			ytRes.setEncoding('utf8');
			ytRes.on('data', function (chunk) {
				data += chunk;
				// console.log('BODY: ' + chunk);
			});

			ytRes.on("end", function(){
				var obj = data;

				console.log(obj);
				res.send(obj);
			});
		}),
		data = "";

	ytReq.on('error', function(e) {
		console.log(e);
	});

	ytReq.end();
};