import _ from 'lodash';

export default (tasks) => {
    if (!_.isArray(tasks)) {
        throw new Error('Tasks parameter must be an array.');
    }

    _.forEach(tasks, (task) => {
        if (!_.isString(task)) {
            throw new Error('Task must be a string.');
        }
    });

    if (tasks.length !== _.uniq(tasks).length) {
        throw new Error('Task array contains non unique values.');
    }

    return true;
};
