// Load modules
var Stream = require('stream');

var Code = require('code');
var Hoek = require('hoek');
var Lab = require('lab');
var Moment = require('moment');
var StandIn = require('stand-in');
var GoodConsoleLogfmt = require('..');


// Declare internals

var internals = {
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


internals.readStream = function (done) {

    var result = new Stream.Readable({ objectMode: true });
    result._read = Hoek.ignore;

    if (typeof done === 'function') {
        result.once('end', done);
    }

    return result;
};

// Test shortcuts

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('GoodConsoleLogfmt', function () {

    it('returns a new object without "new"', function (done) {

        var reporter = GoodConsoleLogfmt({ log: '*' });
        expect(reporter._settings).to.exist();

        done();
    });

    it('returns a new object with "new"', function (done) {

        var reporter = new GoodConsoleLogfmt({ log: '*' });
        expect(reporter._settings).to.exist();

        done();
    });

    it('throws an error if the incomming stream is not in objectMode', function (done) {

        var reporter = GoodConsoleLogfmt({ log: '*' });
        expect(reporter._settings).to.exist();

        var stream = new Stream.Readable();

        reporter.init(stream, null, function (err) {

            expect(err).to.exist();
            expect(err.message).to.equal('stream must be in object mode');
            done();
        });
    });

    describe('_report()', function () {

        describe('printResponse()', function () {

            it('logs to the console for "response" events', function (done) {

                var reporter = GoodConsoleLogfmt({ response: '*' });
                var now = Date.now();
                var timeString = Moment(now).format(internals.defaults.format);

                StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`instance=localhost method=[1;33mpost[0m path=/data query={\\"name\\":\\"adam\\"} statusCode=\u001b[32m200\u001b[0m responseTime=150ms responsePayload="response payload: {\\"foo\\":\\"bar\\",\\"value\\":1}" tags=response timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                internals.response.timestamp = now;

                var s = internals.readStream(done);

                reporter.init(s, null, function (err) {

                    expect(err).to.not.exist();

                    s.push(internals.response);
                    s.push(null);
                });
            });

            it('logs to the console for "response" events without a query', function (done) {

                var reporter = new GoodConsoleLogfmt({ response: '*' });
                var now = Date.now();
                var timeString = Moment(now).format(internals.defaults.format);
                var event = Hoek.clone(internals.response);

                delete event.query;

                StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`instance=localhost method=[1;33mpost[0m path=/data query="" statusCode=[32m200[0m responseTime=150ms responsePayload="response payload: {\\"foo\\":\\"bar\\",\\"value\\":1}" tags=response timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                event.timestamp = now;

                var s = internals.readStream(done);

                reporter.init(s, null, function (err) {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });

            it('logs to the console for "response" events without a responsePayload', function (done) {

                var reporter = new GoodConsoleLogfmt({ response: '*' });
                var now = Date.now();
                var timeString = Moment(now).format(internals.defaults.format);
                var event = Hoek.clone(internals.response);

                delete event.responsePayload;

                StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                    if (string.includes(timeString)) {
                        stand.restore();
                        expect(string).to.equal(`instance=localhost method=[1;33mpost[0m path=/data query={\\"name\\":\\"adam\\"} statusCode=[32m200[0m responseTime=150ms responsePayload="" tags=response timestring=${timeString}\n`);
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                event.timestamp = now;

                var s = internals.readStream(done);

                reporter.init(s, null, function (err) {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });

            it('provides a default color for response methods', function (done) {

                var reporter = new GoodConsoleLogfmt({ response: '*' });
                var now = Date.now();
                var timeString = Moment(now).format(internals.defaults.format);
                var event = Hoek.clone(internals.response);

                StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

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

                var s = internals.readStream(done);

                reporter.init(s, null, function (err) {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });
            });

            it('does not log a status code if there is not one attached', function (done) {

                var reporter = new GoodConsoleLogfmt({ response: '*' });
                var now = Date.now();
                var timeString = Moment(now).format(internals.defaults.format);
                var event = Hoek.clone(internals.response);

                StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

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

                var s = internals.readStream(done);

                reporter.init(s, null, function (err) {

                    expect(err).to.not.exist();
                    s.push(event);
                    s.push(null);
                });

            });

            it('uses different colors for different status codes', function (done) {

                var counter = 1;
                var reporter = new GoodConsoleLogfmt({ response: '*' });
                var now = Date.now();
                var timeString = Moment(now).format(internals.defaults.format);
                var colors = {
                    1: 32,
                    2: 32,
                    3: 36,
                    4: 33,
                    5: 31
                };

                var write = StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                    if (string.includes(timeString)) {
                        var expected = `instance=localhost method=[1;33mpost[0m path=/data query="" statusCode=[${colors[counter]}m${counter * 100}[0m responseTime=150ms responsePayload="" tags=response timestring=${timeString}\n`;
                        expect(string).to.equal(expected);

                        counter++;
                    }
                    else {
                        stand.original(string, enc, callback);
                    }
                });

                var s = internals.readStream(function () {

                    write.restore();
                    done();
                });

                reporter.init(s, null, function (err) {

                    expect(err).to.not.exist();

                    for (var i = 1; i < 6; ++i) {
                        var event = Hoek.clone(internals.response);
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

        it('prints ops events', function (done) {

            var reporter = new GoodConsoleLogfmt({ ops: '*' });
            var now = Date.now();
            var timeString = Moment(now).format(internals.defaults.format);
            var event = Hoek.clone(internals.ops);

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`memory=29Mb uptime (seconds)=6 load=1.650390625,1.6162109375,1.65234375 tags=ops timestring=${timeString}\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            event.timestamp = now;

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();
                s.push(event);
                s.push(null);
            });
        });

        it('prints error events', function (done) {

            var reporter = new GoodConsoleLogfmt({ error: '*' });
            var now = Date.now();
            var timeString = Moment(now).format(internals.defaults.format);
            var event = {
                event: 'error',
                error: {
                    message: 'test message',
                    stack: 'fake stack for testing'
                }
            };

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`message="test message" stack="fake stack for testing" tags=error timestring=${timeString}\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            event.timestamp = now;

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();
                s.push(event);
                s.push(null);
            });
        });

        it('prints request events with string data', function (done) {

            var reporter = new GoodConsoleLogfmt({ request: '*' });
            var now = Date.now();
            var timeString = Moment(now).format(internals.defaults.format);

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`data="you made a request" tags=request,user,info timestring=${timeString}\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            internals.request.timestamp = now;

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();
                s.push(internals.request);
                s.push(null);
            });
        });

        it('prints request events with object data', function (done) {

            var reporter = new GoodConsoleLogfmt({ request: '*' });
            var now = Date.now();
            var timeString = Moment(now).format(internals.defaults.format);

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`data="{\\"message\\":\\"you made a request to a resource\\"}" tags=request,user,info timestring=${timeString}\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            internals.request.timestamp = now;
            internals.request.data = { message: 'you made a request to a resource' };

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();
                s.push(internals.request);
                s.push(null);
            });
        });

        it('logs to the console for "wreck" events', function (done) {

            var reporter = GoodConsoleLogfmt({ wreck: '*' });
            var now = Date.now();
            var timeString = Moment(now).format(internals.defaults.format);

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`method=\u001b[1;32mget\u001b[0m requestUrl=http://localhost/test statusCode=\u001b[32m200\u001b[0m statusMessage=OK timeSpent=29ms tags=wreck timestring=${timeString}\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            internals.wreck.timestamp = now;

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();

                s.push(internals.wreck);
                s.push(null);
            });
        });

        it('logs to the console for "wreck" events that contain errors', function (done) {

            var reporter = GoodConsoleLogfmt({ wreck: '*' });
            var now = Date.now();
            var timeString = Moment(now).format(internals.defaults.format);

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`method=\u001b[1;32mget\u001b[0m requestUrl=http://localhost/test timeSpent=7ms message="test error" stack="test stack" tags=wreck timestring=${timeString}\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            internals.wreckError.timestamp = now;

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();

                s.push(internals.wreckError);
                s.push(null);
            });
        });

        it('prints a generic message for unknown event types with "data" as an object', function (done) {

            var reporter = new GoodConsoleLogfmt({ test: '*' });
            var now = Date.now();
            var timeString = Moment(now).format(internals.defaults.format);
            var event = {
                event: 'test',
                data: {
                    reason: 'for testing'
                },
                tags: ['user'],
                timestamp: now
            };

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`data="{\\"reason\\":\\"for testing\\"}" tags=test,user timestring=${timeString}\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();
                s.push(event);
                s.push(null);
            });
        });

        it('prints a generic message for unknown event types with "data" as a string', function (done) {

            var reporter = new GoodConsoleLogfmt({ test: '*' });
            var now = Date.now();
            var timeString = Moment(now).format(internals.defaults.format);
            var event = {
                event: 'test',
                data: 'for testing',
                tags: ['user'],
                timestamp: now
            };

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`data="for testing" tags=test,user timestring=${timeString}\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();
                s.push(event);
                s.push(null);
            });
        });

        it('prints a generic message for unknown event types with no "data" attribute', function (done) {

            var reporter = new GoodConsoleLogfmt({ test: '*' });
            var now = Date.now();
            var timeString = Moment(now).format(internals.defaults.format);
            var event = {
                event: 'test',
                tags: 'user',
                timestamp: now
            };

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`data=(none) tags=test,user timestring=${timeString}\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();
                s.push(event);
                s.push(null);
            });
        });

        it('prints log events with string data', function (done) {

            var reporter = new GoodConsoleLogfmt({ log: '*' }, { format: 'DD-YY -- ZZ', utc: false });
            var now = Date.now();
            var timeString = Moment(now).format('DD-YY -- ZZ');

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`data="this is a log" tags=log,info timestring="${timeString}"\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

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

        it('prints log events with object data', function (done) {

            var reporter = new GoodConsoleLogfmt({ log: '*' });
            var now = Date.now();
            var timeString = Moment(now).format(internals.defaults.format);

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`data="{\\"message\\":\\"this is a log\\"}" tags=log,info,high timestring=${timeString}\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            internals.request.timestamp = now;

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

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

        it('formats the timestamp based on the supplied option', function (done) {

            var reporter = new GoodConsoleLogfmt({ test: '*' }, { format: 'YYYY' });
            var now = Date.now();
            var timeString = Moment(now).format('YYYY');
            var event = {
                event: 'test',
                data: {
                    reason: 'for testing'
                },
                tags: ['user'],
                timestamp: now
            };

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`data="{\\"reason\\":\\"for testing\\"}" tags=test,user timestring=${timeString}\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();
                s.push(event);
                s.push(null);
            });
        });

        it('formats the timestamp based on the supplied option non-utc mode', function (done) {

            var reporter = new GoodConsoleLogfmt({ test: '*' }, { format: 'YYYY - ZZ', utc: false });
            var now = Date.now();
            var timeString = Moment(now).format('YYYY - ZZ');
            var event = {
                event: 'test',
                data: {
                    reason: 'for testing'
                },
                tags: ['user'],
                timestamp: now
            };

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`data="{\\"reason\\":\\"for testing\\"}" tags=test,user timestring="${timeString}"\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();
                s.push(event);
                s.push(null);
            });
        });

        it('formats the timestamp even if it\'s a string', function (done) {

            var reporter = new GoodConsoleLogfmt({ test: '*' }, { format: 'YYYY - ZZ' });
            var now = Date.now();
            var timeString = Moment(now).format('YYYY - ZZ');
            var event = {
                event: 'test',
                data: {
                    reason: 'for testing'
                },
                tags: ['user'],
                timestamp: now + ''
            };

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes(timeString)) {
                    stand.restore();
                    expect(string).to.equal(`data="{\\"reason\\":\\"for testing\\"}" tags=test,user timestring="${timeString}"\n`);
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();
                s.push(event);
                s.push(null);
            });
        });

        it('uses the current time if the event does not have a timestamp property', function (done) {

            var reporter = new GoodConsoleLogfmt({ test: '*' });
            var event = {
                event: 'test',
                data: {
                    reason: 'for testing'
                },
                tags: ['user', '!!!']
            };

            StandIn.replace(process.stdout, 'write', function (stand, string, enc, callback) {

                if (string.includes('!!!')) {
                    stand.restore();
                    // console.log(string);
                    // `data="{\\"reason\\":\\"for testing\\"}" tags=test,user,!!! timestring=${timeString}\n`
                    expect(/data="{\\"reason\\":\\"for testing\\"}" tags=test,user,!!! timestring=/.test(string)).to.be.true();
                }
                else {
                    stand.original(string, enc, callback);
                }
            });

            var s = internals.readStream(done);

            reporter.init(s, null, function (err) {

                expect(err).to.not.exist();
                s.push(event);
                s.push(null);
            });
        });
    });
});
