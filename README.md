# cluster-map

Abstracts execution of tasks in parallel using [Node.js cluster](https://nodejs.org/api/cluster.html).

It is a high level abstraction around a common pattern used to delegate a list of tasks to the workers.

## API

`createClusterMap` function is used to create `createMap` map function. The created function operates using the instance of `cluster` used to create it. `createMap` function is used to execute tasks in parallel using Node.js cluster.

```js
import {
    createClusterMap
} from 'cluster-map';

/**
 * @typedef {Function} createClusterMap~createMap
 * @param {string[]} tasks An array of unique tasks sent to the workers.
 * @returns {Promise}
 */

/**
 * @typedef {Object} createClusterMap~configuration
 * @property {number} numberOfProcesses Defines number of processes that will be forked (default: number of OS CPUs as determined using https://nodejs.org/api/os.html#os_os_cpus).
 * @property {boolean} log Used to enable logging (https://github.com/gajus/cluster-map#logging) (default: false).
 * @property {number} timeout Used to enable logging of the tasks that take longer than the specified time (in milliseconds) (default: 5000).
 */

/**
 * @param {createClusterMap~cluster} cluster https://nodejs.org/api/cluster.html
 * @param {createClusterMap~configuration} configuration
 * @returns {createMap}
 */
createClusterMap(cluster);
```

`handleTask` function is used to receive tasks and respond to the master.

```js
import {
    handleTask
} from 'cluster-map';


/**
 * Handles a task and returns a promise that is resolved with the result of the task.
 * @typedef {Function} handleTask~handler
 * @param {string} task
 * @returns {Promise}
 */

/**
 * @param {handleTask~handler} task
 */
handleTask(cluster);
```

## Communication With Worker

```js
import {
    handleTask
} from 'cluster-map';

handleTask((task, callback) => {

});
```

## Example

In this example,

* Master declares an array of tasks (`['task 1', 'task 2', 'task 3']`).
* `createClusterMap` is used to create an instance of `clusterMap`.
* `clusterMap` is used to task the workers.
* Workers handle the tasks and reply to the master.
* `clusterMap` waits for all tasks to be processed.
* When all tasks are processes, `clusterMap` resolves with an array of results.

```js
import cluster from 'cluster';
import {
    createClusterMap,
    handleTask
} from 'cluster-map';

if (cluster.isMaster) {
    let clusterMap,
        tasks;

    tasks = [
        'task 1',
        'task 2',
        'task 3'
    ];

    clusterMap = createClusterMap(cluster);

    clusterMap(tasks)
        .then((results) => {
            console.log(results);
        });
}

if (cluster.isWorker) {
    handleTask((task) => {
        return Promise.resolve(task.slice(-1));
    });
}
```

### Using a separate file

`master.js`

```js
import cluster from 'cluster';
import {
    createClusterMap
} from 'cluster-map';

let clusterMap,
    tasks;

tasks = [
    'task 1',
    'task 2',
    'task 3'
];

cluster.setupMaster({
    exec: path.resolve(__dirname, 'worker.js')
});

clusterMap = createClusterMap(cluster);

clusterMap(tasks)
    .then((results) => {

    });
```

`worker.js`

```js
import {
    handleTask
} from 'cluster-map';

handleTask((task) => {
    return Promise.resolve(task.slice(-1));
});
```

## Logging

Logging is enabled using [`log` configuration](https://github.com/gajus/cluster-map#api).

Logging produces an output that describes:

* Number of forked processes.
* Logs time when worker is assigned a task.
* Logs time when worker responds with a result.
* Logs time when either of the tasks take longer than the [`timeout` configuration](https://github.com/gajus/cluster-map#api) to execute.

```
[03:36:46] Spawning 8 worker process(es).
[03:36:46] Tasking worker #1. "/bin/babel-external-helpers.js"
[03:36:46] Tasking worker #3. "/bin/babel-node.js"
[03:36:46] Tasking worker #5. "/bin/babel-plugin.js"
[03:36:46] Tasking worker #4. "/bin/babel.js"
[03:36:46] Tasking worker #7. "/index.js"
[03:36:46] Tasking worker #6. "/lib/_babel-node.js"
[03:36:46] Tasking worker #2. "/lib/babel-external-helpers.js"
[03:36:46] Tasking worker #8. "/lib/babel-node.js"
[03:36:48]
Received result from:      /bin/babel-node.js
Tasks in progress (count): 7
Tasks in progress:
  - /bin/babel-external-helpers.js
  - /bin/babel-plugin.js
  - /bin/babel.js
  - /index.js
  - /lib/_babel-node.js
  - /lib/babel-external-helpers.js
  - /lib/babel-node.js
Remaining tasks (count):   495
[03:36:48] Tasking worker #3. /lib/babel-plugin/index.js
[03:36:48]
Received result from:      /bin/babel-external-helpers.js
Tasks in progress (count): 7
Tasks in progress:
  - /bin/babel-plugin.js
  - /bin/babel.js
  - /index.js
  - /lib/_babel-node.js
  - /lib/babel-external-helpers.js
  - /lib/babel-node.js
  - /lib/babel-plugin/index.js
Remaining tasks (count):   494
```
