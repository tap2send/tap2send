// start.js
const { spawn } = require('child_process');

// Start the server with nodemon if available, fallback to node
const server = spawn('npx', ['nodemon', 'server.js'], { stdio: 'inherit', shell: true });

server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});
