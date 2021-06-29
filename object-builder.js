function buildUserLoggedIn(id,name,token){
    let user = {};
    user.id = id;
    user.name = name;
    user.token = token;
    return user;
}

function buildGroup(row){
    let group = {};
    group.id = row.id;
    group.leader_id = row.leader_id;
    group.name = row.name;
    group.last_changed = row.last_changed;
    return group;
}

function buildMember(result){
    let member = {};
    member.id = result.id;
    member.name = result.name;
    return member;
}

function buildMembers(result){
    let members = [];
    return members;
}

function buildFees(result){
    let fees = [];
    return fees;
}

function buildPresets(result){
    let presets = [];
    return presets;
}

module.exports = {
    buildUserLoggedIn,
    buildGroup,
    buildMember,
    buildMembers,
    buildFees,
    buildPresets
}
