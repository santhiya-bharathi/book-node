import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";  
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";



dotenv.config(); 

const app = express();

const PORT = process.env.PORT; 

app.use(cors());

app.use(express.json()); 

const MONGO_URL = process.env.MONGO_URL;

async function createConnection(){
    const client =  new MongoClient(MONGO_URL) 
    await client.connect();  
    console.log("Mongodb Connected");
    return client;
}

const client = await createConnection();


app.get("/",(request,response)=>{
    response.send("hello happy world");
});

app.get("/book", async (request,response)=>{
    const job = await client 
    .db("b28wd")
    .collection("book")
    .find({})
    .toArray();
    response.send(job);
});


app.post("/book", async (request,response)=>{
    const data = request.body;
    const result = await createBook(data);
    response.send(result);
    });
    

    app.get("/book/:id", async (request,response)=>{
        console.log(request.params);
        const {id} = request.params;
        const movie = await getBookById(id)
        console.log(movie);
    
        movie? response.send(movie) : response.status(404).send({message:"no matching movie found"});
    });
    
    app.delete("/book/:id", async (request,response)=>{
        console.log(request.params);
        const {id} = request.params;
        const result = await deleteBookById(id)
        console.log(result);
    
        result.deletedCount>0? response.send(result) : response.status(404).send({message:"no matching movie found"});
    });
    
    app.put("/book/:id", async (request,response)=>{
        console.log(request.params);
        const {id} = request.params;
        const data = request.body;
        const result = await editBookById(id, data);
        const movie = await getBookById(id);
        console.log(result);
        response.send(movie);
    });
    
    async function editBookById(id, data) {
        return await client
            .db("b28wd")
            .collection("book")
            .updateOne({ _id: ObjectId(id) }, { $set: data });
    }
    
    async function deleteBookById(id) {
        return await client
            .db("b28wd")
            .collection("book")
            .deleteOne({ _id: ObjectId(id) });
    }
    
    async function createBook(data) {
        return await client.db("b28wd").collection("book").insertOne(data);
    }
    
    async function getBookById(id) {
        return await client
            .db("b28wd")
            .collection("book")
            .findOne({ _id: ObjectId(id) });
    }    


    async function createUser(data) {
        return await client.db("b28wd").collection("password").insertOne(data);
    }
    
    async function getUserByName(email) {
        return await client
            .db("b28wd")
            .collection("password")
            .findOne({ email: email });
    }
    
    
    
    async function genPassword(password){
        const NO_OF_ROUNDS = 10;
        const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
        console.log(salt);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(hashedPassword);
        return hashedPassword;
    }
    
    
    app.post("/signup", async (request,response)=>{
        const {email, password} = request.body;
        const userFromDB = await getUserByName(email);
    console.log(userFromDB);
    
    if(userFromDB){
        response.send({message: "email already exists"});
      
        return;
    }
    
    if(password.length < 8){
        response.send({message: "password must be longer"});
       
        return;
    }
        const hashedPassword = await genPassword(password); 
        const result = await createUser({ email, password:hashedPassword });
        response.send(result);   
        });
    
    app.post("/login", async (request,response)=>{
        const {email, password} = request.body;
        const userFromDB = await getUserByName(email);
    
        if(!userFromDB){
            response.send({message: "Invalid Credentials"});
           
            return;
        }
    
        const storedPassword = userFromDB.password;
        console.log(storedPassword);
    
        const isPasswordMatch = await bcrypt.compare(password, storedPassword);
    
        console.log(isPasswordMatch);
        console.log(userFromDB);
    
        if (isPasswordMatch) {
            
            response.send({message: "sucessful login"});
        }else{
            response.send({message: "Invalid Credentials"});
      
        }
    
        
    });

    app.listen(PORT,()=>console.log("app is started in",PORT));