require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ServerDescription, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());


const uri = process.env.MONGODB_URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const run = async () => {
    try {
        // Connect the client to the server
        await client.connect();

        const db = client.db('simpleCrud');
        const usersCollection = db.collection('users');

        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/users/:id', async (req, res) => {
            const id = req.params.id;
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ error: "Invalid user ID format" });
            }
            try {
                const query = { _id: new ObjectId(id) };
                const user = await usersCollection.findOne(query);
                if (!user) {
                    return res.status(404).send({ error: "User not found" });
                }
                res.send(user);
            } catch (error) {
                console.error("Error in GET /users/:id:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        })

        app.post('/users', async (req, res) => {
            const newUser = req.body;
            console.log('user to be inserted', newUser);
            const result = await usersCollection.insertOne(newUser);
            res.send(result);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ error: "Invalid user ID format" });
            }
            try {
                const query = { _id: new ObjectId(id) };
                const result = await usersCollection.deleteOne(query);
                if (result.deletedCount === 0) {
                    return res.status(404).send({ error: "User not found" });
                }
                res.send(result);
            } catch (error) {
                console.error("Error in DELETE /users/:id:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        })

        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ error: "Invalid user ID format" });
            }
            try {
                const query = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: req.body
                };
                const result = await usersCollection.updateOne(query, updateDoc);
                if (result.matchedCount === 0) {
                    return res.status(404).send({ error: "User not found" });
                }
                res.send(result);
            } catch (error) {
                console.error("Error in PATCH /users/:id:", error);
                res.status(500).send({ error: "Internal server error" });
            }
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
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

