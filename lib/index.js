'use strict';

const Squeeze = require('good-squeeze').Squeeze;
const Hoek = require('hoek');
const Moment = require('moment');
const SafeStringify = require('json-stringify-safe');
const Through = require('through2');
const Logfmt = require('logfmt');

// Declare internals

const internals = {
    defaults: {
        utc: true
    }
};

module.exports = internals.GoodConsoleLogfmt = function (events, config) {

    if (!(this instanceof internals.GoodConsoleLogfmt)) {
        return new internals.GoodConsoleLogfmt(events, config);
    }
    config = config || {};
    this._settings = Hoek.applyToDefaults(internals.defaults, config);
    this._filter = new Squeeze(events);
};

internals.GoodConsoleLogfmt.prototype.init = function (stream, emitter, callback) {

    const self = this;

    if (!stream._readableState.objectMode) {
        return callback(new Error('stream must be in object mode'));
    }

    stream.pipe(this._filter).pipe(Through.obj(function goodConsoleLogfmtTransform(data, enc, next) {

        const eventName = data.event;
        let tags = [];

        /*eslint-disable */
        if (Array.isArray(data.tags)) {
            tags = data.tags.concat([]);
        } else if (data.tags != null) {
            tags = [data.tags];
        }
        /*eslint-enable */

        tags.unshift(eventName);

        if (eventName === 'response') {
            this.push(self._formatResponse(data, tags));
            return next();
        }

        if (eventName ===  'wreck') {
            this.push(self._formatWreck(data, tags));
            return next();
        }

        const eventPrintData = {
            timestamp: data.timestamp || Date.now(),
            data: undefined,
            tags
        };

        if (eventName === 'ops') {
            eventPrintData.data = {
                memory: Math.round(data.proc.mem.rss / (1024 * 1024)) + 'Mb',
                'uptime (seconds)': data.proc.uptime,
                load: data.os.load
            };

            this.push(self._printEvent(eventPrintData));
            return next();
        }

        if (eventName === 'error') {
            eventPrintData.data = {
                'message': data.error.message,
                'stack': data.error.stack
            };

            this.push(self._printEvent(eventPrintData));
            return next();
        }

        if (eventName === 'request' || eventName === 'log') {
            eventPrintData.data = {
                'data': data.data
            };

            this.push(self._printEvent(eventPrintData));
            return next();
        }

        // Event that is unknown to good-console, try a defualt.
        if (data.data) {
            eventPrintData.data = {
                'data': (typeof data.data === 'object' ? SafeStringify(data.data) : data.data)
            };
        }
        else {
            eventPrintData.data = {
                data: '(none)'
            };
        }

        this.push(self._printEvent(eventPrintData));
        return next();
    })).pipe(process.stdout);

    callback();
};

internals.GoodConsoleLogfmt.prototype._printEvent = function (event) {

    const m = Moment(parseInt(event.timestamp, 10));
    if (!this._settings.utc) {
        m.local();
    }

    const timestring = m.toISOString();
    let data = {};
    if (typeof event.data === 'object' &&
        event.data.data &&
        typeof event.data.data === 'object') {
        const requestData = event.data.data;
        Object.keys(requestData).forEach((key) => {

            let dataValue = requestData[key];
            if (typeof dataValue === 'object') {
                dataValue = SafeStringify(dataValue);
            }
            data[key] = dataValue;
        });
    }
    else {
        data = event.data;
    }
    data.tags = event.tags.toString();
    data.timestring = timestring;

    return  Logfmt.stringify(data) + '\n';
};

internals.GoodConsoleLogfmt.prototype._formatResponse = function (event, tags) {

    const query = event.query ? JSON.stringify(event.query) : '';
    let responsePayload = '';

    if (typeof event.responsePayload === 'object' && event.responsePayload) {
        responsePayload = 'response payload: ' + SafeStringify(event.responsePayload);
    }

    const method = this._formatMethod(event.method);
    const statusCode = this._formatStatusCode(event.statusCode) || '';

    return this._printEvent({
        timestamp: event.timestamp,
        tags,
        data: {
            instance: event.instance,
            method,
            path: event.path,
            query,
            statusCode,
            responseTime: event.responseTime + 'ms',
            responsePayload
        }
    });
};

internals.GoodConsoleLogfmt.prototype._formatWreck = function (event, tags) {

    let data;
    let statusCode;
    const method = this._formatMethod(event.request.method);

    if (event.error) {
        data = {
            method,
            requestUrl: event.request.url,
            timeSpent: event.timeSpent + 'ms',
            message: event.error.message,
            stack: event.error.stack
        };
    }
    else {
        statusCode = this._formatStatusCode(event.response.statusCode);
        data = {
            method,
            requestUrl: event.request.url,
            statusCode,
            statusMessage: event.response.statusMessage,
            timeSpent: event.timeSpent + 'ms'
        };
    }

    return this._printEvent({
        timestamp: event.timestamp,
        tags,
        data
    });
};

internals.GoodConsoleLogfmt.prototype._formatMethod = function (method) {

    const methodColors = {
        get: 32,
        delete: 31,
        put: 36,
        post: 33
    };
    const color = methodColors[method.toLowerCase()] || 34;
    return '\x1b[1;' + color + 'm' + method.toLowerCase() + '\x1b[0m';
};

internals.GoodConsoleLogfmt.prototype._formatStatusCode = function (statusCode) {

    let color;
    if (statusCode) {
        color = 32;
        if (statusCode >= 500) {
            color = 31;
        }
        else if (statusCode >= 400) {
            color = 33;
        }
        else if (statusCode >= 300) {
            color = 36;
        }
        return '\x1b[' + color + 'm' + statusCode + '\x1b[0m';
    }
    return statusCode;
};

internals.GoodConsoleLogfmt.attributes = {
    pkg: require('../package.json')
};
