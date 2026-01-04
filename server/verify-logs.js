const http = require('http');

function getLogs(path) {
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: path,
        method: 'GET',
    };

    const req = http.request(options, (res) => {
        console.log(`GET ${path} - STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log(`Received ${json.length} records.`);
                if (json.length > 0) {
                    console.log('Sample record:', json[0]);
                }
            } catch (e) {
                console.log('Response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

getLogs('/api/logs/security');
getLogs('/api/logs/visitors');
