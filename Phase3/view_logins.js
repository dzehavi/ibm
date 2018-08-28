/** read credentials from stored credentials file **/
var fs = require('fs');
var readline = require('readline');
var querystring = require('querystring');
var filename = './credentials.txt';

fs.exists(filename, function(exists) {
	if (exists) {
		var myInterface = readline.createInterface({
  			input: fs.createReadStream('./credentials.txt')
		});

		var users = [];
		var user = {};
		var index = 0;
		myInterface.on('line', function (line) {
			user = querystring.parse(line);
			users[index] = user.id;
			index++;
		});
		myInterface.on('close', function (line) {
			/** log unique user names **/
			console.log([...new Set(users)].toString());  
		});
	} else {
    console.log(filename + ": no such file");
  }
});

