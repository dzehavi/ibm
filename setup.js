var fs = require('fs');
var readline = require('readline');
var querystring = require('querystring');
var encryptor = require('./encryptor');

/** read users from file **/
var myInterface = readline.createInterface({
  input: fs.createReadStream('users.txt')
});

fs.unlink('./usersdb.txt', function (err) {
  	if (err) throw err;
  	console.log('File deleted!');
});
  

var user = {};
myInterface.on('line', function (line) {
  user = querystring.parse(line);
  console.log('Adding user : ' + user.id);
  var hashAndSalt = encryptor.encrypt(user.password, encryptor.generateSalt());
  var userString = 'id='+user.id+'&hash='+hashAndSalt.hash+'&salt='+hashAndSalt.salt+'&balance='+user.balance;
  
  	/** write user info + hashed password and salt to db **/
  	fs.appendFile('usersdb.txt', userString+'\n', function (err) {
  		if (err) throw err;
  		console.log('Saved!');
	});
});
