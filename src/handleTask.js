export default (taskHandler) => {
    process.on('message', (task) => {
        taskHandler(task)
            .then((result) => {
                process.send({
                    task,
                    result
                });
            });
    });
};
