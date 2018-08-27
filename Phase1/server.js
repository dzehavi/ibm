var http = require('http');
var fs = require('fs');
var readline = require('readline');
var querystring = require('querystring');
var encryptor = require('../encryptor');

/** read users from db **/
var myInterface = readline.createInterface({
  input: fs.createReadStream('../usersdb.txt')
});

var users = [];
var user = {};
myInterface.on('line', function (line) {
  user = querystring.parse(line);
  console.log('Adding user : ' + user.id);
  users[user.id] = user;
});

server = http.createServer(function(request, response) {
	/** virtualizing the host. Checking the target host and routing to the right server **/
    switch(request.headers.host) {
        case 'bank-example.com': 
        case 'bank-example.com:8080':
        	if (request.url == "/") {
        		response.end(`
            		<!doctype html>
            		<html>
            		<body>
                		<form action="/login" method="post">
                    		User: <input type="email" name="email" /><br />
                    		Password: <input type="password" name="password" /><br />
                    		<button>Login</button>
                		</form>
            		</body>
            		</html>
        		`);        	
        	}
			else if (request.url == "/login") {
				handleLogin(request, (user, err) => {
					if (err) {
						response.writeHead(200, { "Content-Type": "text/html" });
						response.end("Error: " + err);
					}
					else {
						/** redirect to balance page **/
						var token = encryptor.generateSalt();
						var cookies = 'token='+token+','+'balance='+user.balance;
						response.writeHead(302, {'Content-Type': 'text/plain', 'Location': '/balance', 'Set-Cookie': cookies});
						response.end();
					}
				});
			}
			else if (request.url == "/balance") {
				if (request.headers.cookie) {
					var cookies = request.headers.cookie;
					var token = -1;
					var balance = -1;
					console.log('cookies : ' + cookies);
					cookies.split(',').forEach(function( cookie ) {
        				var parts = cookie.split('=');
        				console.log('Parts : ' + parts);
        				if (parts[0]=='token') {
        					token = parts[1];
        				}
        				else if (parts[0]=='balance') {
        					balance = parts[1];
        				}
    				});
					response.end('Your balance is : ' + balance);
				}
				else {
					response.statusCode = 403;
					response.end("You do not have rights to visit this page");				
				}
			}
        	break;
        default: 
            response.statusCode = 404;
            response.end('<p>We do not serve the host: <b>' + request.headers.host + '</b>.</p>');
    }
});

server.listen(8080);

/** handler user login **/
function handleLogin(request, callback) {
    let body = '';
    request.on('data', chunk => {
        body += chunk.toString();
    });
    request.on('end', () => {
 		var credentials = querystring.parse(body);
 		var email = credentials.email;
 		var user = users[email];
 		if (user == null) {
 			callback(null, 'User not found: ' + email);
 		}
 		else {
 			var hashAndSalt = encryptor.encrypt(credentials.password, user.salt);
 			if (user.hash != hashAndSalt.hash) {
 				callback(null, 'Wrong password');
 			}
 			else {
 				callback(user, null);
 			}

 		}
    });
}

