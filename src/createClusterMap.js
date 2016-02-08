import _ from 'lodash';
import chalk from 'chalk';
import log from './log';
import getConfiguration from './getConfiguration';
import validateTasks from './validateTasks';
import prettyjson from 'prettyjson';

export default (cluster, userConfiguration = {}): Function => {
    let configuration;

    configuration = getConfiguration(userConfiguration);

    return (tasks: Array<string>): Promise => {
        return new Promise((resolve) => {
            let taskWorker,
                currentTaskIndex,
                numberOfTasks,
                tasksInProgress,
                results,
                getNextTask,
                registerResult,
                timeouts;

            results = [];
            tasksInProgress = [];

            timeouts = {};

            currentTaskIndex = -1;

            numberOfTasks = tasks.length;

            validateTasks(tasks);

            _.times(configuration.numberOfProcesses, cluster.fork.bind(cluster));

            if (configuration.log) {
                log('Spawning ' + configuration.numberOfProcesses + ' worker process(es).');
            }

            getNextTask = () => {
                return tasks[++currentTaskIndex] || null;
            };

            taskWorker = (worker) => {
                let nextTask;

                nextTask = getNextTask();

                if (nextTask) {
                    log('Tasking worker #' + worker.id + '. "' + chalk.blue(nextTask) + '".');

                    tasksInProgress.push(nextTask);

                    worker.send(nextTask);

                    timeouts[nextTask.clusterMapId] = setTimeout(() => {
                        log('nextTask timeout', nextTask);
                    }, configuration.timeout);
                } else if (results.length === numberOfTasks) {
                    cluster.disconnect(() => {
                        resolve(_.map(results, (result) => {
                            return result.result;
                        }));
                    });
                } else {
                    worker.disconnect();
                }
            };

            registerResult = (message: Object) => {
                let taskInProgressIndex;

                if (!_.has(message, 'task')) {
                    throw new Error('Child process message object must have "task" property.');
                }

                if (!_.has(message, 'result')) {
                    throw new Error('Child process message object must have "result" property.');
                }

                taskInProgressIndex = _.indexOf(tasksInProgress, message.task);

                if (taskInProgressIndex === -1) {
                    log({
                        task: message.task,
                        taskInProgressIndex,
                        tasksInProgress
                    });

                    throw new Error('Task does not exist in the processing queue.');
                }

                _.pullAt(tasksInProgress, taskInProgressIndex);

                results.push(message);

                clearTimeout(timeouts[message.clusterMapId]);

                log('\n' + prettyjson.render({
                    'Received result from': message.task,
                    'Tasks in progress (count)': tasksInProgress.length,
                    'Tasks in progress': tasksInProgress,
                    'Remaining tasks (count)': tasks.length - results.length
                }));
            };

            cluster.on('online', taskWorker);

            _.forEach(cluster.workers, (worker) => {
                worker.on('message', (message) => {
                    if (configuration.log) {
                        registerResult(message);
                    }

                    taskWorker(worker);
                });
                worker.on('error', (code, signal) => {
                    log('error', {
                        code,
                        signal
                    });
                });
            });
        });
    };
};
