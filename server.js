// intialize express
const express = require('express');
const app = express();
const port = 3000;

// serve static file from the public folder
app.use(express.static('public'));

// start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
