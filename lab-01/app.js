/*
====================================================================
Lab 1: Node.js and Express server
Module: Node.js and Express.js fundamentals
====================================================================

TASK 3 DEMONSTRATION (Plain Node.js HTTP server):
In pure Node.js, we can create a basic HTTP server using the built-in
'http' module without any external packages:

const http = require('http');

const server = http.createServer((request, response) => {
    response.end('Hello');
});

server.listen(3000);

Note: The code above is commented out so only our Express server
listens on port 3000.
====================================================================
*/

// Import express module using CommonJS
const express = require('express');

// Initialize the express application
const app = express();

// Set the port from environment variable (for Render deployment) or default to 3000
const PORT = process.env.PORT || 3000;

// TASK 7: Simple console logging middleware
// Logs the HTTP method and requested URL for every incoming request
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// TASK 5 - Route 1: GET /
// Returns welcome message and student details with status code 200
app.get('/', (req, res) => {
    console.log(`[RESPONSE] Status: 200 OK for /`);
    res.status(200).json({
        message: "Welcome to the Backend Development Fundamentals Lab 1!",
        student: "Abhiram Thunikipati",
        registrationNumber: "252U1R1244",
        lab: "Lab 1 - Node.js and Express Server"
    });
});

// TASK 5 - Route 2: GET /about
// Returns student details as a JSON object with status code 200
app.get('/about', (req, res) => {
    console.log(`[RESPONSE] Status: 200 OK for /about`);
    res.status(200).json({
        name: 'Abhiram Thunikipati',
        registrationNumber: '252U1R1244',
        section: 'CSE-2E'
    });
});

// TASK 5 - Route 3: GET /time
// Returns current date and time as a JSON object with status code 200
app.get('/time', (req, res) => {
    console.log(`[RESPONSE] Status: 200 OK for /time`);
    res.status(200).json({
        currentTime: new Date()
    });
});

// TASK 6: 404 Route for handling unknown paths
// This middleware runs only if no previous route matched the request
app.use((req, res) => {
    console.log(`[RESPONSE] Status: 404 Not Found for ${req.url}`);
    res.status(404).json({
        error: 'Page not found'
    });
});

// TASK 4 & TASK 13: Start the server and listen on the configured PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
