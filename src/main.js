import net from 'net'
import fs from 'fs'
// eslint-disable-next-line import/no-extraneous-dependencies
import lo from 'lodash'

const server = net.createServer();

function Request(requestString){
    const items = requestString.toString('utf-8').split('\r\n');
    
    if(items[0]) {
        const header = items[0].split(' ');
        this.Method = header[0];
        this.Path = header[1];
        this.Version = header[2];
    }
    this.Headers = { }

    lo.tail(items).forEach(header => {
        if(header.includes(': ')) {
            const keyValue = header.split(': ')
            this.Headers[keyValue[0]] = keyValue[1];
        }
    })
}

function print(request){
    console.log(`Version -> ${  request.Version}`);
    console.log(`Path -> ${  request.Path}`);
    console.log(`Method -> ${  request.Method}`);

    lo.forEach(request.Headers, (value, key) => {
        console.log(`${key} -> ${value}`);
    });
}

function getResponse(status, content){
    return `HTTP/1.1 ${status}
Date: ${new Date()}
Connection: close
Server: Yanjss
Accept-Ranges: bytes
Content-Type: text/html
Content-Lenght: ${content.length}

${content}`;
}

server.on('connection', socket => {
    socket.on('data', data => {
        if(data.includes(Buffer.from([0x0d, 0x0a]))) {
            const request = new Request(data);
            print(request);

            fs.readFile(`./static${request.Path}`, (err, fileData) => {
                if (err) {
                    switch(err.code) {
                        case 'ENOENT':
                            socket.end(getResponse('404 Not found', '<html><body><h1>404 Not found</h1></body></html>'));
                            break;
                        case 'EPERM':
                            socket.end(getResponse('400 Bad request', '<html><body><h1>404 Not found</h1></body></html>'));
                            break;
                        default:
                            socket.end(getResponse('500 Internal server error', `<html><body><h1>${err}</h1></body></html>`));
                    }
                }
                else {
                    const response = getResponse("200 OK", fileData);
                    socket.end(response);
                }
            })
        }
    })
})

server.listen(process.env.PORT || 3000)
