require('dotenv').config()
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000
const app = express()

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d3h8n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const userCollection = client.db("bdPayDB").collection("users");
        const transactionCollection = client.db("bdPayDB").collection("transactions");


        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
            res.send({ token });
        })

        // middlewares 
        const verifyToken = (req, res, next) => {
            // console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }



        app.post("/users", async (req, res) => {
            const user = req.body;
            // check if the user already exists...
            const query = { email: user.email, nid: user.nid, phone: user.phone }
            const existingUser = await userCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: "user already exists", insertedId: null });
            }
            const result = await userCollection.insertOne({ ...user, timestamp: Date.now() });
            res.send(result);
        })

        // post initial balance for user
        app.post("/create-initial-user-balance", verifyToken, async (req, res) => {
            const balanceData = req.body;
            // check if the user already exists...
            const query = { email: balanceData.email, phone: balanceData.phone }
            const existingUser = await transactionCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: "user already exists", insertedId: null });
            }
            const result = await transactionCollection.insertOne({
                ...balanceData,
                transactionAmount: 40.00,
                transactionType: "in",
                currentBalance: 40.00, // Adding balance field
                timestamp: Date.now()
            });
            res.send(result);
        })

        // get a specific user data
        app.get("/user/role/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const result = await userCollection.findOne(query);
            res.send(result);
        })

        // get updated data of an user
        app.get("/user-updated-data/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const result = await transactionCollection.findOne(query,
                { sort: { timestamp: -1 } });
            res.send(result);
        })









        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello from BD_Pay Server..')
})

app.listen(port, () => {
    console.log(`BD_Pay is running on port ${port}`)
})