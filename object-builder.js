function buildUserLoggedIn(id,name,token){
    let user = {};
    user.id = id;
    user.name = name;
    user.token = token;
    return user;
}

function buildUser(id,name){
    let user = {};
    user.id = id;
    user.name = name;
    return user;
}

module.exports = {
    buildUserLoggedIn,
    buildUser
}
