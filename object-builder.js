function buildUserLoggedIn(id,name,token){
    let user = {};
    user.id = id;
    user.name = name;
    user.token = token;
    return user;
}

function buildGroups(rows){
    let groups = [];
    rows.forEach(row => groups.push(buildGroup(row)));
    return groups;
}

function buildGroup(row){
    let group = {};
    group.id = row.id;
    group.leader_id = row.leader_id;
    group.name = row.name;
    return group;
}

function buildGroupRaw(id,leader_id,name){
    let group = {};
    group.id = id;
    group.leader_id = leader_id;
    group.name = name;
    return group;
}

function buildUser(row){
    let member = {};
    member.id = row.id;
    member.name = row.name;
    return member;
}

function buildUsers(rows){
    let members = [];
    rows.forEach(row => members.push(buildUser(row)));
    return members;
}

function buildFees(rows){
    let fees = [];
    rows.forEach(row => fees.push(buildFee(row)));
    return fees;
}

function buildFee(row){
    let fee = {};
    fee.id = row.id;
    fee.user_id = row.user_id;
    fee.name = row.name;
    fee.amount = row.amount;
    fee.status = row.status;
    return fee;
}

function buildFeeRaw(id,user_id,name,amount,status){
    let fee = {};
    fee.id = id;
    fee.user_id = user_id;
    fee.name = name;
    fee.amount = amount;
    fee.status = status;
    return fee;
}

function buildPresets(rows){
    let presets = [];
    rows.forEach(row => presets.push(buildPreset(row)));
    return presets;
}

function buildPreset(row){
    let preset = {};
    preset.id = row.id;
    preset.name = row.name;
    preset.amount = row.amount;
    return preset;
}

function buildPresetRaw(id,name,amount){
    let preset = {};
    preset.id = id;
    preset.name = name;
    preset.amount = amount;
    return preset;
}

module.exports = {
    buildUserLoggedIn,
    buildGroups,
    buildGroup,
    buildGroupRaw,
    buildUsers,
    buildUser,
    buildFees,
    buildFee,
    buildFeeRaw,
    buildPresets,
    buildPreset,
    buildPresetRaw
}
