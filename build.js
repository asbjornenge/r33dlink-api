'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _htmlToText = require('html-to-text');

var _htmlToText2 = _interopRequireDefault(_htmlToText);

var _easyRead = require('easy-read');

var _easyRead2 = _interopRequireDefault(_easyRead);

var _textract = require('textract');

var _textract2 = _interopRequireDefault(_textract);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var supportedContentTypes = {
    'text/html': function textHtml(html, callback) {
        (0, _easyRead2.default)(html, function (res) {
            var text = _htmlToText2.default.fromString(res.content, { ignoreHref: true, ignoreImage: true });
            callback(text);
        });
    },
    'application/pdf': function applicationPdf(pdf, callback) {
        _textract2.default.fromBufferWithMime('application/pdf', pdf, { preserveLineBreaks: true }, function (err, text) {
            if (err) throw err;
            callback(text);
        });
    }
};

var supportedContentType = function supportedContentType(headers) {
    return Object.keys(supportedContentTypes).reduce(function (res, ctt) {
        if (res) return res;
        if (headers['content-type'].indexOf(ctt) >= 0) return ctt;
    }, false);
};

var bad = function bad(res, msg) {
    res.writeHead(401, {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(msg);
};

var good = function good(res, text) {
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(text);
};

var server = _http2.default.createServer(function (req, res) {
    var _req = _url2.default.parse(req.url, true);
    var _bad = bad.bind(undefined, res);
    var _good = good.bind(undefined, res);
    if (_req.pathname != '/') return _bad('Bad path');
    if (!_req.query.link) return _bad('Missing link');
    var link = _req.query.link;
    var options = {};
    if (link.indexOf('.pdf') > 0) options.encoding = null;
    options.gzip = true;
    try {
        _request2.default.get(_req.query.link, options, function (err, _res) {
            if (err) return _bad(err.toString());
            if (_res.statusCode != 200) return _bad('Bad response from link');
            var ctt = supportedContentType(_res.headers);
            if (!ctt) return _bad('Unsupported Content Type');
            return supportedContentTypes[ctt](_res.body, _good);
        });
    } catch (err) {
        return _bad(err.toString());
    }
});

server.listen(1337, '0.0.0.0', function () {
    console.log('Listening to 0.0.0.0:1337');
});
