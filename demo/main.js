const utils = require('./utils');

module.exports = {
    init: function() {
        console.log('Main module initialized with utils:', utils);
        return utils.greet('World');
    }
};