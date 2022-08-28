var StringDecoder = require('string_decoder').StringDecoder
var FormData = require('form-data')
var Stream = require('stream')
var mime = require('mime')
var path = require('path')
var URL = require('url')
var fs = require('fs')

/**
 * Define form mime type
 */
mime.define({
    'application/x-www-form-urlencoded': ['form', 'urlencoded', 'form-data']
})

/**
 * Initialize our Rest Container
 */
var RestClient = function (method, uri, headers, body, callback) {
    var restClient = function (uri, headers, body, callback) {
        var $this = {
            /**
             * Stream Multipart form-data request
             *
             * @type {Boolean}
             */
            _stream: false,

            /**
             * Container to hold multipart form data for processing upon request.
             *
             * @type {Array}
             * @private
             */
            _multipart: [],

            /**
             * Container to hold form data for processing upon request.
             *
             * @type {Array}
             * @private
             */
            _form: [],

            /**
             * Request option container for details about the request.
             *
             * @type {Object}
             */
            options: {
                /**
                 * Url obtained from request method arguments.
                 *
                 * @type {String}
                 */
                url: uri,

                /**
                 * Method obtained from request method arguments.
                 *
                 * @type {String}
                 */
                method: method,

                /**
                 * List of headers with case-sensitive fields.
                 *
                 * @type {Object}
                 */
                headers: {}
            },

            hasHeader: function (name) {
                var headers
                var lowercaseHeaders

                name = name.toLowerCase()
                headers = Object.keys($this.options.headers)
                lowercaseHeaders = headers.map(function (header) {
                    return header.toLowerCase()
                })

                for (var i = 0; i < lowercaseHeaders.length; i++) {
                    if (lowercaseHeaders[i] === name) {
                        return headers[i]
                    }
                }

                return false
            },

            field: function (name, value, options) {
                return handleField(name, value, options)
            },

            attach: function (name, path, options) {
                options = options || {}
                options.attachment = true
                return handleField(name, path, options)
            },

            rawField: function (name, value, options) {
                $this._multipart.push({
                    name: name,
                    value: value,
                    options: options,
                    attachment: options.attachment || false
                })
            },

            header: function (field, value) {
                if (is(field).a(Object)) {
                    for (var key in field) {
                        if (field.hasOwnProperty(key)) {
                            $this.header(key, field[key])
                        }
                    }

                    return $this
                }

                var existingHeaderName = $this.hasHeader(field)
                $this.options.headers[existingHeaderName || field] = value

                return $this
            },

            type: function (type) {
                $this.header('Content-Type', does(type).contain('/')
                    ? type
                    : mime.lookup(type))
                return $this
            },

            send: function (data) {
                var type = $this.options.headers[$this.hasHeader('content-type')]

                if ((is(data).a(Object) || is(data).a(Array)) && !Buffer.isBuffer(data)) {
                    if (!type) {
                        $this.type('form')
                        type = $this.options.headers[$this.hasHeader('content-type')]
                        $this.options.body = RestClient.serializers.form(data)
                    } else if (~type.indexOf('json')) {
                        $this.options.json = true

                        if ($this.options.body && is($this.options.body).a(Object)) {
                            for (var key in data) {
                                if (data.hasOwnProperty(key)) {
                                    $this.options.body[key] = data[key]
                                }
                            }
                        } else {
                            $this.options.body = data
                        }
                    } else {
                        $this.options.body = RestClient.Request.serialize(data, type)
                    }
                } else if (is(data).a(String)) {
                    if (!type) {
                        $this.type('form')
                        type = $this.options.headers[$this.hasHeader('content-type')]
                    }

                    if (type === 'application/x-www-form-urlencoded') {
                        $this.options.body = $this.options.body
                            ? $this.options.body + '&' + data
                            : data
                    } else {
                        $this.options.body = ($this.options.body || '') + data
                    }
                } else {
                    $this.options.body = data
                }

                return $this
            },

            end: function (callback) {
                var Request
                var header
                var parts
                var form

                function handleRequestResponse (error, response, body) {
                    var result = {}
                    // Handle pure error
                    if (error && !response) {
                        result.error = error

                        if (callback) {
                            callback(result)
                        }

                        return
                    }

                    if (!response) {
                        console.log('This is odd, report this action / request to: http://github.com/mashape/RestClient-nodejs')

                        result.error = {
                            message: 'No response found.'
                        }

                        if (callback) {
                            callback(result)
                        }

                        return
                    }

                    // Create response reference
                    result = response

                    body = body || response.body
                    result.raw_body = body
                    result.headers = response.headers

                    if (body) {
                        type = RestClient.type(result.headers['content-type'], true)
                        if (type) data = RestClient.Response.parse(body, type)
                        else data = body
                    }
                    result.body = data

                    ;(callback) && callback(result)
                }

                function handleGZIPResponse (response) {
                    if (/^(deflate|gzip)$/.test(response.headers['content-encoding'])) {
                        var unzip = zlib.createUnzip()
                        var stream = new Stream()
                        var _on = response.on
                        var decoder

                        // Keeping node happy
                        stream.req = response.req

                        // Make sure we emit prior to processing
                        unzip.on('error', function (error) {
                            // Catch the parser error when there is no content
                            if (error.errno === zlib.Z_BUF_ERROR || error.errno === zlib.Z_DATA_ERROR) {
                                stream.emit('end')
                                return
                            }

                            stream.emit('error', error)
                        })

                        // Start the processing
                        response.pipe(unzip)

                        // Ensure encoding is captured
                        response.setEncoding = function (type) {
                            decoder = new StringDecoder(type)
                        }

                        // Capture decompression and decode with captured encoding
                        unzip.on('data', function (buffer) {
                            if (!decoder) return stream.emit('data', buffer)
                            var string = decoder.write(buffer)
                            if (string.length) stream.emit('data', string)
                        })

                        // Emit yoself
                        unzip.on('end', function () {
                            stream.emit('end')
                        })

                        response.on = function (type, next) {
                            if (type === 'data' || type === 'end') {
                                stream.on(type, next)
                            } else if (type === 'error') {
                                _on.call(response, type, next)
                            } else {
                                _on.call(response, type, next)
                            }
                        }
                    }
                }

                function handleFormData (form) {
                    for (var i = 0; i < $this._multipart.length; i++) {
                        var item = $this._multipart[i]

                        if (item.attachment && is(item.value).a(String)) {
                            if (does(item.value).contain('http://') || does(item.value).contain('https://')) {
                                item.value = RestClient.request(item.value)
                            } else {
                                item.value = fs.createReadStream(path.resolve(item.value))
                            }
                        }
                        form.append(item.name, item.value, item.options)
                    }

                    return form
                }

                if ($this._multipart.length && !$this._stream && $this.options.method != 'get') {
	                header = $this.options.headers[$this.hasHeader('content-type')]
	                parts = URL.parse($this.options.url)
	                form = new FormData()

	                if (header) {
		                $this.options.headers['content-type'] = header.split(';')[0] + '; boundary=' + form.getBoundary()
	                } else {
		                $this.options.headers['content-type'] = 'multipart/form-data; boundary=' + form.getBoundary()
	                }

	                return handleFormData(form).submit({
		                protocol: parts.protocol,
		                port: parts.port,
		                host: parts.hostname,
		                path: parts.path,
		                method: $this.options.method,
		                headers: $this.options.headers
	                }, function (error, response) {
		                var decoder = new StringDecoder('utf8')

		                if (error) {
			                return handleRequestResponse(error, response)
		                }

		                if (!response.body) {
			                response.body = ''
		                }

		                // Node 10+
		                response.resume()

		                // GZIP, Feel me?
		                handleGZIPResponse(response)

		                // Fallback
		                response.on('data', function (chunk) {
			                if (typeof chunk === 'string') response.body += chunk
			                else response.body += decoder.write(chunk)
		                })

		                // After all, we end up here
		                response.on('end', function () {
			                return handleRequestResponse(error, response)
		                })
	                })
                }

	            Request = RestClient.request($this.options, handleRequestResponse)
	            Request.on('response', handleGZIPResponse)

	            if ($this._multipart.length && $this._stream) {
		            handleFormData(Request.form())
	            }

	            return Request
            }
        }

        /**
         * Alias for _.header_
         * @type {Function}
         */
        $this.headers = $this.header

        /**
         * Alias for _.header_
         *
         * @type {Function}
         */
        $this.set = $this.header

        /**
         * Alias for _.end_
         *
         * @type {Function}
         */
        $this.complete = $this.end

        /**
         * Aliases for _.end_
         *
         * @type {Object}
         */

        $this.as = {
            json: $this.end,
            binary: $this.end,
            string: $this.end
        }

        /**
         * Handles Multipart Field Processing
         *
         * @param {String} name
         * @param {Mixed} value
         * @param {Object} options
         */
        function handleField (name, value, options) {
            var serialized
            var length
            var key
            var i

            options = options || { attachment: false }

            if (is(name).a(Object)) {
                for (key in name) {
                    if (name.hasOwnProperty(key)) {
                        handleField(key, name[key], options)
                    }
                }
            } else {
                if (is(value).a(Array)) {
                    for (i = 0, length = value.length; i < length; i++) {
                        serialized = handleFieldValue(value[i])
                        if (serialized) {
                            $this.rawField(name, serialized, options)
                        }
                    }
                } else if (value != null) {
                    $this.rawField(name, handleFieldValue(value), options)
                }
            }

            return $this
        }

        /**
         * Handles Multipart Value Processing
         *
         * @param {Mixed} value
         */
        function handleFieldValue (value) {
            if (!(value instanceof Buffer || typeof value === 'string')) {
                if (is(value).a(Object)) {
                    if (value instanceof Stream.Readable) {
                        return value
                    } else {
                        return RestClient.serializers.json(value)
                    }
                } else {
                    return value.toString()
                }
            } else return value
        }

        if (headers && typeof headers === 'function') {
            callback = headers
            headers = null
        } else if (body && typeof body === 'function') {
            callback = body
            body = null
        }

        if (headers) $this.set(headers)
        if (body) $this.send(body)

        return callback ? $this.end(callback) : $this
    }

    return uri ? restClient(uri, headers, body, callback) : restClient
}

/**
 * Expose the underlying layer.
 */
RestClient.request = require('request')
RestClient.pipe = RestClient.request.pipe


RestClient.type = function (type, parse) {
    if (typeof type !== 'string') return false
    return parse ? type.split(/ *; */).shift() : (RestClient.types[type] || type)
}


RestClient.trim = ''.trim
    ? function (s) { return s.trim() }
    : function (s) { return s.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '') }

RestClient.parsers = {
    string: function (data) {
        var obj = {}
        var pairs = data.split('&')
        var parts
        var pair

        for (var i = 0, len = pairs.length; i < len; ++i) {
            pair = pairs[i]
            parts = pair.split('=')
            obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1])
        }

        return obj
    },

    json: function (data) {
        try {
            data = JSON.parse(data)
        } catch (e) {}

        return data
    }
}

/**
 * Serialization methods for different data types.
 *
 * @type {Object}
 */
RestClient.serializers = {
    form: function (obj) {
        return QueryString.stringify(obj)
    },

    json: function (obj) {
        return JSON.stringify(obj)
    }
}

/**
 * RestClient Request Utility Methods
 *
 * @type {Object}
 */
RestClient.Request = {
    serialize: function (string, type) {
        var serializer = RestClient.firstMatch(type, RestClient.enum.serialize)
        return serializer ? serializer(string) : string
    }
}

RestClient.Response = {
    parse: function (string, type) {
        var parser = RestClient.firstMatch(type, RestClient.enum.parse)
        return parser ? parser(string) : string
    }
}

/**
 * Enum Structures
 *
 * @type {Object}
 */
RestClient.enum = {
    serialize: {
        'application/x-www-form-urlencoded': RestClient.serializers.form,
        'application/json': RestClient.serializers.json,
        'text/javascript': RestClient.serializers.json
    },

    parse: {
        'application/x-www-form-urlencoded': RestClient.parsers.string,
        'application/json': RestClient.parsers.json,
        'text/javascript': RestClient.parsers.json
    },

    methods: [
        'GET',
        'HEAD',
        'PUT',
        'POST',
        'PATCH',
        'DELETE',
        'OPTIONS'
    ]
}

RestClient.matches = function matches (string, map) {
    var results = []

    for (var key in map) {
        if (typeof map.length !== 'undefined') {
            key = map[key]
        }

        if (string.indexOf(key) !== -1) {
            results.push(map[key])
        }
    }

    return results
}

RestClient.firstMatch = function firstMatch (string, map) {
    return RestClient.matches(string, map)[0]
}

/**
 * Generate sugar for request library.
 *
 * This allows us to mock super-agent chaining style while using request library under the hood.
 */
function setupMethod (method) {
    RestClient[method] = RestClient(method)
}

for (var i = 0; i < RestClient.enum.methods.length; i++) {
    var method = RestClient.enum.methods[i].toLowerCase()
    setupMethod(method)
}

function is (value) {
    return {
        a: function (check) {
            if (check.prototype) check = check.prototype.constructor.name
            var type = Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
            return value != null && type === check.toLowerCase()
        }
    }
}

/**
 * Simple Utility Methods for checking information about a value.
 *
 * @param  {Mixed}  value  Could be anything.
 * @return {Object}
 */
function does (value) {
    var arrayIndexOf = (Array.indexOf ? function (arr, obj, from) {
        return arr.indexOf(obj, from)
    } : function (arr, obj, from) {
        var l = arr.length
        var i = from ? parseInt((1 * from) + (from < 0 ? l : 0), 10) : 0
        i = i < 0 ? 0 : i
        for (; i < l; i++) if (i in arr && arr[i] === obj) return i
        return -1
    })

    return {
        contain: function (field) {
            if (is(value).a(String)) return value.indexOf(field) > -1
            if (is(value).a(Object)) return value.hasOwnProperty(field)
            if (is(value).a(Array)) return !!~arrayIndexOf(value, field)
            return false
        }
    }
}

/**
 * Expose the RestClient Container
 */
module.exports = exports = RestClient
