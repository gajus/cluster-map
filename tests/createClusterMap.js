import {
    expect
} from 'chai';
import sinon from 'sinon';
import createClusterMap from './../src/createClusterMap';

describe('createClusterMap()', () => {
    let cluster,
        clusterMap,
        worker;

    beforeEach(() => {
        worker = {
            id: 1,
            on () {},
            send () {},
            message () {},
            disconnect () {}
        };

        cluster = {
            disconnect (callback) {
                callback();
            },
            fork () {},
            on () {},
            workers: [
                worker
            ]
        };
    });

    describe('#clusterMap()', () => {
        it('binds cluster.on online event handler', () => {
            let spy;

            spy = sinon.spy(cluster, 'on');

            clusterMap = createClusterMap(cluster);

            clusterMap(['foo']);

            expect(spy.calledOnce).to.equal(true, 'calledOnce');
            expect(spy.calledWith('online')).to.equal(true, 'calledWith');
        });
        context('worker comes online', () => {
            it('assigns worker a task', (done) => {
                let spy;

                spy = sinon.spy(worker, 'send');

                cluster.on = (eventName, taskWorker) => {
                    expect(eventName).to.equal('online', 'event name');

                    taskWorker(worker);

                    expect(spy.calledOnce).to.equal(true, 'calledOnce');
                    expect(spy.calledWith('foo')).to.equal(true, 'calledWith');

                    done();
                };

                clusterMap = createClusterMap(cluster);

                clusterMap(['foo']);
            });
        });
        context('workers complete all tasks', () => {
            it('resolves with the result', (done) => {
                let spy;

                spy = sinon.spy(worker, 'send');

                worker.on = (eventName, resultHandler) => {
                    if (eventName === 'message') {
                        resultHandler('bar');
                    }
                };

                cluster.on = (eventName, taskWorker) => {
                    taskWorker(worker);
                };

                clusterMap = createClusterMap(cluster);

                clusterMap(['foo'])
                    .then((results) => {
                        expect(results).to.deep.equal(['bar']);

                        done();
                    });
            });
        });
    });
});
