import express from "express";
import cors from "cors";


const corsOptions = {
    origin: [
        "http://localhost:5173",
        "http://localhost:5174"
    ]
};
//create expres app
const app = express();

//to parse incoming data
app.use(express.json());
app.use(cors(corsOptions));
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

/* Routes implementation */


const PORT = 3000;

app.listen(PORT, () => {
    console.log("Listening to port 3000....");
});