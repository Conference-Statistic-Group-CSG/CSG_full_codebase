require("dotenv").config();
const express = require("express");
const app = express();


const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

//local host for back-end is running on 5000 port 
const PORT = process.env.PORT || 5000



app.listen(PORT, ()=>{
   console.log(`Server is runnig on this PORT => ${PORT} Port`)
})

