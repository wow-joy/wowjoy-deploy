const URL = require('url')
const https = require('https')
const qs = require("querystring");

module.exports = function fetch(url, params, options = { method: "GET" }) {
  const { hostname, path } = URL.parse(url);
  let content;
  if (options.method.toLowerCase() === "get") {
    url = `${url}?${qs.stringify(params)}`;
  }else {
    content = JSON.stringify(params)
  }
  let response = ''
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        ...options,
        hostname,
        path,
        headers: {
          "Content-type": "application/json",
          "Content-length": Buffer.byteLength(content),
          ...options.headers
        },
      },
      res => {
        res.setEncoding("utf8");
        res.on("data", chunk => {
          response+=chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(response))
        })
      }
    );
    req.on("error", e => reject(e));
    if (options.method.toLowerCase() === "post") {
      req.write(content);
    }
    req.end();
  });
}