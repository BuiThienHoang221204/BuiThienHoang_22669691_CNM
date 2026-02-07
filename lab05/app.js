const express = require('express');
const path = require('path');
const productRoutes = require('./routes/products');
const app = express();
require("dotenv").config(); 
// Middleware 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

//View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//Routes
app.use('/', productRoutes);

//Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});