const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const os = require('os');
const querystring = require('querystring');
const formidable = require('formidable'); // Correct import

const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'password'

const serveStaticFiles = (res, filePath, contentType) => {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end("404 Not Found");
        } else {
            res.writeHead(200, {'Content-Type': contentType});
            res.end(data);
        }
    });
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log(`Request: ${req.method} ${req.url}`);

    if (pathname === '/') {
        serveStaticFiles(res, path.join(__dirname, 'public', 'login.html'), 'text/html');
    } else if (pathname === '/dashboard') {
        serveStaticFiles(res, path.join(__dirname, 'public', 'index.html'), 'text/html')
    } else if (pathname === '/login') {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end' ,() => {
                const { username, password } = JSON.parse(body);
                if (username === VALID_USERNAME && password === VALID_PASSWORD) {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(500, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({ success: false }))
                }
            })
        } else {
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.end('Method Not Allowed')
        }
    } else if (pathname === '/system') {
        serveStaticFiles(res, path.join(__dirname, 'public', 'system.html'), 'text/html');
    } else if (pathname === '/file-manager') {
        serveStaticFiles(res, path.join(__dirname, 'public', 'file-manager.html'), 'text/html');
    } else if (pathname === '/styles.css') {
        serveStaticFiles(res, path.join(__dirname, 'public', 'styles.css'), 'text/css');
    } else if (pathname === '/sysinfo') {
        const sysInfo = {
            platform: os.platform(),
            arch: os.arch(),
            uptime: os.uptime(),
            loadavg: os.loadavg(),
            totalmem: os.totalmem(),
            freemem: os.freemem(),
            cpus: os.cpus()
        };

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(sysInfo, null, 2));
    } else if (pathname === '/files') {
        const directoryPath = path.join(__dirname, 'public');

        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: "Failed to read directory."}));
            } else {
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({files}));
            }
        });
    } else if (pathname === '/upload') {
        if (req.method === 'POST') {
            const form = new formidable.IncomingForm(); // Create a new IncomingForm instance

            form.parse(req, (err, fields, files) => {
                if (err) {
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.end("File upload error");
                    return;
                }
                
                // Get the uploaded file
                const uploadedFile = files.file[0];
                const newFilePath = path.join(__dirname, 'public', uploadedFile.originalFilename);
                
                fs.rename(uploadedFile.filepath, newFilePath, (err) => {
                    if (err) {
                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end("Error saving file");
                        return;
                    }
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end("File uploaded successfully");
                });
            });
        } else {
            res.writeHead(405, {'Content-Type': 'text/plain'});
            res.end("Method Not Allowed");
        }
    } else if (pathname === '/delete') {
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                const { fileName } = JSON.parse(body);
                const filePath = path.join(__dirname, 'public', fileName);
    
                fs.unlink(filePath, err => {
                    if (err) {
                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end("Error deleting file");
                        return;
                    }
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end("File deleted successfully");
                });
            });
        } else {
            res.writeHead(405, {'Content-Type': 'text/plain'});
            res.end("Method Not Allowed");
        }
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end("404 Not Found");
    }
}).listen(8080, () => {
    console.log('Server running on http://localhost:8080');
});
