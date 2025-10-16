import http from 'http';

const PORT = 8000;

const server = http.createServer((req, res) => {
    res.write('Shalom');
    res.end();
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
})