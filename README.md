# good-console-logfmt

Console broadcasting for Good process monitor, using logfmt formatting

[![Build Status](https://travis-ci.org/cadecairos/good-console-logfmt.svg?branch=master)](http://travis-ci.org/cadecairos/good-console-logfmt)![Current Version](https://img.shields.io/npm/v/good-console-logfmt.svg)

Lead Maintainer: [Christopher De Cairos](https://github.com/cadecairos)

## Usage

`good-console-logfmt` is a [good](https://github.com/hapijs/good) reporter implementation to write [hapi](http://hapijs.com/) server events to the console. It uses the [logfmt package](https://www.npmjs.com/package/logfmt) to format log output.

## `GoodConsoleLogfmt(events, [config])`
Creates a new GoodConsoleLogfmt object with the following arguments:

- `events` - an object of key value pairs.
	- `key` - one of the supported [good events](https://github.com/hapijs/good) indicating the hapi event to subscribe to
	- `value` - a single string or an array of strings to filter incoming events. "\*" indicates no filtering. `null` and `undefined` are assumed to be "\*"
- `[config]` - optional configuration object with the following available keys
	- `utc` - boolean controlling Moment using [utc mode](http://momentjs.com/docs/#/parsing/utc/) or not. Defaults to `true`.

## Good Console Logfmt Methods
### `goodconsolelogfmt.init(stream, emitter, callback)`
Initializes the reporter with the following arguments:

- `stream` - a Node readable stream that will be the source of data for this reporter. It is assumed that `stream` is in `objectMode`.
- `emitter` - an event emitter object.
- `callback` - a callback to execute when the start function has complete all the necessary set up steps and is ready to receive data.
