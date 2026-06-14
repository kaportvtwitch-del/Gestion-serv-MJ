const config = require('../config.json');

function isAdminMJ(member) {

    return member.roles.cache.has(
        config.adminRoleId
    );
}

module.exports = {
    isAdminMJ
};