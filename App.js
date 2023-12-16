const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// const fileUpload = require('express-fileupload');
const signRoutes = require('./src/routes/create_user');
const updateuser= require('./src/routes/createuser_update');
const bookingRouts= require('./src/routes/bookingrouts');
const GetAlluser=require('./src/routes/getAll')

const app = express();

app.use(cors());
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(fileUpload());
// app.use(express.static('public'));
app.use(express.json());
app.use('/api', signRoutes,updateuser,GetAlluser);
app.use('/api',bookingRouts)

const db = require('./src/db/db'); 




app.listen(3003, () => {
    console.log('Server is running on port 3003');
});

