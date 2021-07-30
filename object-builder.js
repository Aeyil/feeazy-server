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
    return fee;
}

function buildFeeRaw(id,user_id,name,amount){
    let fee = {};
    fee.id = id;
    fee.user_id = user_id;
    fee.name = name;
    fee.amount = amount;
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
    buildGroup,
    buildMember,
    buildMembers,
    buildFees,
    buildFee,
    buildFeeRaw,
    buildPresets,
    buildPreset,
    buildPresetRaw
}
