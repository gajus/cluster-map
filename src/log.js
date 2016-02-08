import chalk from 'chalk';
import fecha from 'fecha';

export default (...append) => {
    /* eslint-disable no-console */
    console.log(chalk.grey('[' + fecha.format(new Date(), 'hh:mm:ss') + ']'), ...append);
    /* eslint-enable */
};
