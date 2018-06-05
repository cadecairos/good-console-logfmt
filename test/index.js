'use strict';

const Stream = require('stream');

const Code = require('code');
const Hoek = require('hoek');
const Lab = require('lab');
const Moment = require('moment');
const StandIn = require('stand-in');
const GoodConsoleLogfmt = require('..');


// Declare internals

const internals = {
    defaults: {
        format: 'YYMMDD/HHmmss.SSS'
    }
};

internals.ops = {
    event: 'ops',
    timestamp: 1411583264547,
    os: {
        load: [1.650390625, 1.6162109375, 1.65234375],
        mem: { total: 17179869184, free: 8190681088 },
        uptime: 704891
    },
    proc: {
        uptime: 6,
        mem: {
            rss: 30019584,
            heapTotal: 18635008,
            heapUsed: 9989304
        },
        delay: 0.03084501624107361
    },
    load: { requests: {}, concurrents: {}, responseTimes: {} },
    pid: 64291
};

internals.response = {
    event: 'response',
    method: 'post',
    statusCode: 200,
    timestamp: Date.now(),
    instance: 'localhost',
    path: '/data',
    responseTime: 150,
    query: {
        name: 'adam'
    },
    responsePayload: {
        foo: 'bar',
        value: 1
    }
};

internals.request = {
    event: 'request',
    timestamp: 1411583264547,
    tags: ['user', 'info'],
    data: 'you made a request',
    pid: 64291,
    id: '1419005623332:new-host.local:48767:i3vrb3z7:10000',
    method: 'get',
    path: '/'
};

internals.wreck = {
    event: 'wreck',
    timestamp: 1446738313624,
    timeSpent: 29,
    pid: 25316,
    request: {
        method: 'GET',
        path: '/test',
        url: 'http://localhost/test',
        protocol: 'http:',
        host: 'localhost'
    },
    response: {
        statusCode: 200,
        statusMessage: 'OK'
    }
};

internals.wreckError = {
    event: 'wreck',
    timestamp: 1446740440479,
    timeSpent: 7,
    pid: 28215,
    error: {
        message: 'test error',
        stack: 'test stack'
    },
    request: {
        method: 'GET',
        path: '/test',
        url: 'http://localhost/test',
        protocol: 'http:',
        host: 'localhost',
        headers: {
            host: 'localhost'
        }
    },
    response: {
        statusCode: undefined,
        statusMessage: undefined,
        headers: undefined
    }
};


internals.readStream = (done) => {

    const result = new Stream.Readable({ objectMode: true });
    result._read = Hoek.ignore;

    if (typeof done === 'function') {
        result.once('end', done);
    }

    return result;
};

// Test shortcuts

const lab = exports.lab = Lab.script();
const expect = Code.expect;
const describe = lab.describe;
const it = lab.it;

describe('GoodConsoleLogfmt', () => {

    it('returns a new object without "new"', () => {

        const reporter = GoodConsoleLogfmt({ log: '*' });
        expect(reporter._settings).to.exist();
    });

    it('returns a new object with "new"', () => {

        const reporter = new GoodConsoleLogfmt({ log: '*' });
        expect(reporter._settings).to.exist();
    });

    it('throws an error if the incomming stream is not in objectMode', () => {

        const reporter = GoodConsoleLogfmt({ log: '*' });
        expect(reporter._settings).to.exist();

        const stream = new Stream.Readable();

        return new Promise((resolve) => {

            reporter.init(stream, null, (err) => {

                expect(err).to.exist();
                expect(err.message).to.equal('stream must be in object mode');
                resolve();
            });
        });
    });

    describe('_report()', () => {

        describe('printResponse()', () => {

            it('logs to the console for "response" events', () => {

                return new Promise((resolve) => {

                    const reporter = GoodConsoleLogfmt({ response: '*' });
                    const now = Date.now();
                    const timeString = Moment(now).toISOString();
                    StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                        if (string.includes(timeString)) {
                            stand.restore();
                            expect(string).to.equal(`instance=localhost method=[1;33mpost[0m path=/data query={\\"name\\":\\"adam\\"} statusCode=\u001b[32m200\u001b[0m responseTime=150ms responsePayload="response payload: {\\"foo\\":\\"bar\\",\\"value\\":1}" tags=response timestring=${timeString}\n`);
                        }
                        else {
                            stand.original(string, enc, callback);
                        }
                    });

                    internals.response.timestamp = now;

                    const s = internals.readStream(() => resolve());

                    reporter.init(s, null, (err) => {

                        expect(err).to.not.exist();

                        s.push(internals.response);
                        s.push(null);
                    });
                });
            });

            it('logs to the console for "response" events without a query', () => {

                const reporter = new GoodConsoleLogfmt({ response: '*' });
                const now = Date.now();
                const timeString = Moment(now).toISOString();
                const event = Hoek.clone(internals.response);

                delete event.query;

                return new Promise((resolve) => {

                    StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                        if (string.includes(timeString)) {
                            stand.restore();
                            expect(string).to.equal(`instance=localhost method=[1;33mpost[0m path=/data query="" statusCode=[32m200[0m responseTime=150ms responsePayload="response payload: {\\"foo\\":\\"bar\\",\\"value\\":1}" tags=response timestring=${timeString}\n`);
                        }
                        else {
                            stand.original(string, enc, callback);
                        }
                    });

                    event.timestamp = now;

                    const s = internals.readStream(() => resolve());

                    reporter.init(s, null, (err) => {

                        expect(err).to.not.exist();
                        s.push(event);
                        s.push(null);
                    });
                });
            });

            it('logs to the console for "response" events without a responsePayload', () => {

                const reporter = new GoodConsoleLogfmt({ response: '*' });
                const now = Date.now();
                const timeString = Moment(now).toISOString();
                const event = Hoek.clone(internals.response);

                delete event.responsePayload;

                return new Promise((resolve) => {

                    StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                        if (string.includes(timeString)) {
                            stand.restore();
                            expect(string).to.equal(`instance=localhost method=[1;33mpost[0m path=/data query={\\"name\\":\\"adam\\"} statusCode=[32m200[0m responseTime=150ms responsePayload="" tags=response timestring=${timeString}\n`);
                        }
                        else {
                            stand.original(string, enc, callback);
                        }
                    });

                    event.timestamp = now;

                    const s = internals.readStream(() => resolve());

                    reporter.init(s, null, (err) => {

                        expect(err).to.not.exist();
                        s.push(event);
                        s.push(null);
                    });
                });
            });

            it('provides a default color for response methods', () => {

                const reporter = new GoodConsoleLogfmt({ response: '*' });
                const now = Date.now();
                const timeString = Moment(now).toISOString();
                const event = Hoek.clone(internals.response);

                return new Promise((resolve) => {

                    StandIn.replace(process.stdout, 'write', (stand, string, enc, callback)  => {

                        if (string.includes(timeString)) {
                            stand.restore();
                            expect(string).to.equal(`instance=localhost method=[1;34mhead[0m path=/data query={\\"name\\":\\"adam\\"} statusCode=[32m200[0m responseTime=150ms responsePayload="response payload: {\\"foo\\":\\"bar\\",\\"value\\":1}" tags=response timestring=${timeString}\n`);
                        }
                        else {
                            stand.original(string, enc, callback);
                        }
                    });

                    event.timestamp = now;
                    event.method = 'head';

                    const s = internals.readStream(() => resolve());

                    reporter.init(s, null, (err) => {

                        expect(err).to.not.exist();
                        s.push(event);
                        s.push(null);
                    });
                });
            });

            it('does not log a status code if there is not one attached', () => {

                const reporter = new GoodConsoleLogfmt({ response: '*' });
                const now = Date.now();
                const timeString = Moment(now).toISOString();
                const event = Hoek.clone(internals.response);

                return new Promise((resolve) => {

                    StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                        if (string.includes(timeString)) {
                            stand.restore();
                            expect(string).to.equal(`instance=localhost method=[1;33mpost[0m path=/data query={\\"name\\":\\"adam\\"} statusCode="" responseTime=150ms responsePayload="response payload: {\\"foo\\":\\"bar\\",\\"value\\":1}" tags=response timestring=${timeString}\n`);
                        }
                        else {
                            stand.original(string, enc, callback);
                        }
                    });

                    event.timestamp = now;
                    delete event.statusCode;

                    const s = internals.readStream(() => resolve());

                    reporter.init(s, null, (err) => {

                        expect(err).to.not.exist();
                        s.push(event);
                        s.push(null);
                    });
                });

            });

            it('uses different colors for different status codes', () => {

                let counter = 1;
                const reporter = new GoodConsoleLogfmt({ response: '*' });
                const now = Date.now();
                const timeString = Moment(now).toISOString();
                const colors = {
                    1: 32,
                    2: 32,
                    3: 36,
                    4: 33,
                    5: 31
                };

                return new Promise((resolve) => {

                    const write = StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                        if (string.includes(timeString)) {
                            const expected = `instance=localhost method=[1;33mpost[0m path=/data query="" statusCode=[${colors[counter]}m${counter * 100}[0m responseTime=150ms responsePayload="" tags=response timestring=${timeString}\n`;
                            expect(string).to.equal(expected);

                            counter++;
                        }
                        else {
                            stand.original(string, enc, callback);
                        }
                    });

                    const s = internals.readStream(() => {

                        write.restore();
                        resolve();
                    });

                    reporter.init(s, null, (err) => {

                        expect(err).to.not.exist();

                        for (let i = 1; i < 6; ++i) {
                            const event = Hoek.clone(internals.response);
                            event.statusCode = i * 100;
                            event.timestamp = now;

                            delete event.query;
                            delete event.responsePayload;

                            s.push(event);
                        }
                        s.push(null);
                    });
                });
            });
        });

        it('prints ops events', () => {

            return new Promise((resolve) => {

                const reporter = new GoodConsoleLogfmt({ ops: '*' });
                const now = Date.now();
                const timeString = Moment(now).toISOString();
                const event = Hoek.clone(internals.ops);

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`memory=29Mb uptime (seconds)=6 load=1.650390625,1.6162109375,1.65234375 tags=ops timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                event.timestamp = now;

                const s = internals.readStream(() => {

                    resolve();
                });

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });
        });

        it('prints error events', () => {

            const reporter = new GoodConsoleLogfmt({ error: '*' });
            const now = Date.now();
            const timeString = Moment(now).toISOString();
            const event = {
                event: 'error',
                error: {
                    message: 'test message',
                    stack: 'fake stack for testing'
                }
            };

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`message="test message" stack="fake stack for testing" tags=error timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                event.timestamp = now;

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });
        });

        it('prints request events with string data', () => {

            const reporter = new GoodConsoleLogfmt({ request: '*' });
            const now = Date.now();
            const timeString = Moment(now).toISOString();

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`data="you made a request" tags=request,user,info timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                internals.request.timestamp = now;

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push(internals.request);
                    s.push(null);
                });
            });
        });

        it('flattens request events with object data', () => {

            const reporter = new GoodConsoleLogfmt({ request: '*' });
            const now = Date.now();
            const timeString = Moment(now).toISOString();

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`message="you made a request to a resource" tags=request,user,info timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                internals.request.timestamp = now;
                internals.request.data = { message: 'you made a request to a resource' };

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push(internals.request);
                    s.push(null);
                });
            });
        });

        it('logs to the console for "wreck" events', () => {

            const reporter = GoodConsoleLogfmt({ wreck: '*' });
            const now = Date.now();
            const timeString = Moment(now).toISOString();

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`method=\u001b[1;32mget\u001b[0m requestUrl=http://localhost/test statusCode=\u001b[32m200\u001b[0m statusMessage=OK timeSpent=29ms tags=wreck timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                internals.wreck.timestamp = now;

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();

                    s.push(internals.wreck);
                    s.push(null);
                });
            });
        });

        it('logs to the console for "wreck" events that contain errors', () => {

            const reporter = GoodConsoleLogfmt({ wreck: '*' });
            const now = Date.now();
            const timeString = Moment(now).toISOString();

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`method=\u001b[1;32mget\u001b[0m requestUrl=http://localhost/test timeSpent=7ms message="test error" stack="test stack" tags=wreck timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                internals.wreckError.timestamp = now;

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();

                    s.push(internals.wreckError);
                    s.push(null);
                });
            });
        });

        it('prints a generic message for unknown event types with "data" as an object', () => {

            const reporter = new GoodConsoleLogfmt({ test: '*' });
            const now = Date.now();
            const timeString = Moment(now).toISOString();
            const event = {
                event: 'test',
                data: {
                    reason: 'for testing'
                },
                tags: ['user'],
                timestamp: now
            };

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`data="{\\"reason\\":\\"for testing\\"}" tags=test,user timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });
        });

        it('prints a generic message for unknown event types with "data" as a string', () => {

            const reporter = new GoodConsoleLogfmt({ test: '*' });
            const now = Date.now();
            const timeString = Moment(now).toISOString();
            const event = {
                event: 'test',
                data: 'for testing',
                tags: ['user'],
                timestamp: now
            };

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`data="for testing" tags=test,user timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });
        });

        it('prints a generic message for unknown event types with no "data" attribute', () => {

            const reporter = new GoodConsoleLogfmt({ test: '*' });
            const now = Date.now();
            const timeString = Moment(now).toISOString();
            const event = {
                event: 'test',
                tags: 'user',
                timestamp: now
            };

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`data=(none) tags=test,user timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });
        });

        it('prints log events with string data', () => {

            const reporter = new GoodConsoleLogfmt({ log: '*' }, { utc: false });
            const now = Date.now();
            const timeString = Moment(now).toISOString();

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`data="this is a log" tags=log,info timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push({
                        event: 'log',
                        timestamp: now,
                        tags: ['info'],
                        data: 'this is a log'
                    });
                    s.push(null);
                });
            });
        });

        it('flattens log events with object data', () => {

            const reporter = new GoodConsoleLogfmt({ log: '*' });
            const now = Date.now();
            const timeString = Moment(now).toISOString();

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`message="this is a log" tags=log,info,high timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                internals.request.timestamp = now;

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push({
                        event: 'log',
                        timestamp: now,
                        tags: ['info', 'high'],
                        data: {
                            message: 'this is a log'
                        }
                    });
                    s.push(null);
                });
            });
        });

        it('formats the timestamp based on the supplied option non-utc mode', () => {

            const reporter = new GoodConsoleLogfmt({ test: '*' }, { utc: false });
            const now = Date.now();
            const timeString = Moment(now).toISOString();
            const event = {
                event: 'test',
                data: {
                    reason: 'for testing'
                },
                tags: ['user'],
                timestamp: now
            };

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`data="{\\"reason\\":\\"for testing\\"}" tags=test,user timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) => {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });
        });

        it('uses the current time if the event does not have a timestamp property', () => {

            const reporter = new GoodConsoleLogfmt({ test: '*' });
            const event = {
                event: 'test',
                data: {
                    reason: 'for testing'
                },
                tags: ['user', '!!!']
            };

            return new Promise((resolve) => {

                StandIn.replace(process.stdout, 'write', (stand, string, enc, callback) => {

                    if (string.includes('!!!')) {
                        stand.restore();
                        expect(/data="{\\"reason\\":\\"for testing\\"}" tags=test,user,!!! timestring=/.test(string)).to.be.true();
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                const s = internals.readStream(() => resolve());

                reporter.init(s, null, (err) =>git  {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });
        });
    });
});
