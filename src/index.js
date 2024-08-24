import dotenv from "dotenv"
dotenv.config({
    path:"../env"
})

import { connectDB } from "./db/index.js";
import { app } from "./app.js";


const port = process.env.PORT || 8888

connectDB()
    .then(() => {

        app.on("error", (err) => {
            console.log("Server Error : ",err);
            throw err
        })

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
            
        })
        
    })
    .catch((err) => {
    console.log("MpngoDb connection fails... ",err);
    
})