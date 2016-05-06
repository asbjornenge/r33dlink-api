import fs          from 'fs'
import path        from 'path'
import htmlToText  from 'html-to-text'
import readability from 'easy-read'
import textract    from 'textract'
import url         from 'url'
import http        from 'http'
import request     from 'request'

let supportedContentTypes = {
    'text/html' : (html, callback) => {
        readability(html, (res) => {
            let text = htmlToText.fromString(res.content, {ignoreHref: true, ignoreImage: true})
            callback(text)
        })
    },
    'application/pdf' : (pdf, callback) => {
        textract.fromBufferWithMime('application/pdf', pdf, { preserveLineBreaks : true }, (err, text) => {
            if (err) throw err
            callback(text)
        })
    }
}

let supportedContentType = (headers) => {
    return Object.keys(supportedContentTypes).reduce((res, ctt) => {
        if (res) return res
        if (headers['content-type'].indexOf(ctt) >= 0) return ctt
    }, false)
}

let bad = (res, msg) => {
    res.writeHead(401, {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(msg);
}

let good = (res, text) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(text);
}

let server = http.createServer((req, res) => {
    let _req  = url.parse(req.url, true)
    let _bad  = bad.bind(undefined, res)
    let _good = good.bind(undefined, res)
    if (_req.pathname != '/') return _bad('Bad path')
    if (!_req.query.link) return _bad('Missing link')
    let link = _req.query.link
    let options = {}
    if (link.indexOf('.pdf') > 0) options.encoding = null
    options.gzip = true
    try {
        request.get(_req.query.link, options, (err, _res) => {
            if (err) return _bad(err.toString())
            if (_res.statusCode != 200) 
                return _bad('Bad response from link')
            let ctt = supportedContentType(_res.headers) 
            if (!ctt) return _bad('Unsupported Content Type')
            return supportedContentTypes[ctt](_res.body, _good) 
        })
    } catch(err) {
        return _bad(err.toString())
    }
})

server.listen(1337, '0.0.0.0', () => {
    console.log('Listening to 0.0.0.0:1337')
})

