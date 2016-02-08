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
                logResult,
                trackTask,
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
                    if (configuration.log) {
                        trackTask(worker, nextTask);
                    }

                    worker.send(nextTask);
                } else if (results.length === numberOfTasks) {
                    cluster.disconnect(() => {
                        resolve(results);
                    });
                } else {
                    worker.disconnect();
                }
            };

            trackTask = (worker, task) => {
                log('Tasking worker #' + worker.id + '. "' + chalk.blue(task) + '".');

                tasksInProgress[worker.id] = task;

                timeouts[worker.id] = setTimeout(() => {
                    log('Task timeout.', task);
                }, configuration.timeout);
            };

            logResult = (worker, result: Object) => {
                let task;

                task = tasksInProgress[worker.id];

                if (!task) {
                    throw new Error('Task does not exist in the processing queue.');
                }

                clearTimeout(timeouts[worker.id]);

                log('\n' + prettyjson.render({
                    'Received result from': task,
                    'Tasks in progress (count)': _.size(tasksInProgress),
                    'Tasks in progress': tasksInProgress,
                    'Remaining tasks (count)': tasks.length - results.length
                }));

                delete tasksInProgress[worker.id];
                delete timeouts[worker.id];
            };

            cluster.on('online', taskWorker);

            _.forEach(cluster.workers, (worker) => {
                worker.on('message', (result) => {
                    results.push(result);

                    if (configuration.log) {
                        logResult(worker, result);
                    }

                    taskWorker(worker);
                });
                worker.on('error', () => {
                    log({
                        task: tasksInProgress[worker.id]
                    });

                    throw new Error('An error occurred.');
                });
            });
        });
    };
};
