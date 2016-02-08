import {
    expect
} from 'chai';
import os from 'os';
import getConfiguration from './../src/getConfiguration';

describe('getConfiguration()', () => {
    describe('default configuration', () => {
        it('gets default configuration', () => {
            let configuration;

            configuration = getConfiguration({});

            expect(configuration).to.deep.equal({
                numberOfProcesses: os.cpus().length,
                log: false,
                timeout: 5000
            });
        });
    });
    describe('user provided configuration', () => {
        it('overwrites user provided properties', () => {
            let configuration;

            configuration = getConfiguration({
                numberOfProcesses: 1
            });

            expect(configuration).to.deep.equal({
                numberOfProcesses: 1,
                log: false,
                timeout: 5000
            });
        });
    });
});
