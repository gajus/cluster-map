import _ from 'lodash';
import os from 'os';

let numberOfCpus;

numberOfCpus = os.cpus().length;

export default (userConfiguration = {}) => {
    let defaultConfiguration;

    defaultConfiguration = {
        numberOfProcesses: numberOfCpus,
        log: false,
        timeout: 5000
    };

    return _.assign(defaultConfiguration, userConfiguration);
};
