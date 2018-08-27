var crypto = require('crypto');

exports.generateSalt = function(){
    return crypto.randomBytes(8)
            .toString('hex') 
            .slice(0,16);  
};

var sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); 
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
};

exports.encrypt = function(userpassword, salt) {
    var passwordData = sha512(userpassword, salt);
    return {hash: passwordData.passwordHash, salt: salt};
}
