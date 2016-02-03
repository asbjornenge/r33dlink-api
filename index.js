import fs          from 'fs'
import path        from 'path'
import htmlToText  from 'html-to-text'
import readability from 'easy-read'
import url         from 'url'
import http        from 'http'
import request     from 'request'

let getTextFromHtml = (html, callback) => {
    readability(html, (res) => {
        let text = htmlToText.fromString(res.content, {ignoreHref: true, ignoreImage: true})
        callback(text)
    })
}

let supportedContentTypes = ['text/html']
let supportedContentType = (headers) => {
    return supportedContentTypes.reduce((res, ctt) => {
        if (res) return res
        return headers['content-type'].indexOf(ctt) >= 0
    }, false)
}

let bad = (res, msg) => {
    res.writeHead(401, {'Content-Type': 'text/plain; charset=UTF-8'});
    res.end(msg);
}

let good = (res, text) => {
    res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
    res.end(text);
}

let server = http.createServer((req, res) => {
    let _req  = url.parse(req.url, true)
    let _bad  = bad.bind(undefined, res)
    let _good = good.bind(undefined, res)
    if (_req.pathname != '/') return _bad('Bad path')
    if (!_req.query.link) return _bad('Missing link')
    try {
        request.get(_req.query.link, (err, _res) => {
            if (err) return _bad(err.toString())
            if (_res.statusCode != 200) 
                return _bad('Bad response from link')
            if (!supportedContentType(_res.headers)) 
                return _bad('Unsupported Content Type')
            return getTextFromHtml(_res.body, _good)
        })
    } catch(err) {
        return _bad(err.toString())
    }
})

server.listen(1337, '127.0.0.1', () => {
    console.log('Listening to 127.0.0.1:1337')
})

