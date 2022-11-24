const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;


const app = express();

/* Middleware */
app.use(cors())
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kzjjck3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const productsCollection = client.db('resalesDokan').collection('products');
        const productsBrandCollection = client.db('resalesDokan').collection('brandwise');
        app.get('/products', async (req, res) => {
            const query = {}
            const product = await productsCollection.find(query).toArray();
            res.send(product);
        })
    }
    finally {

    }
}
run().catch(console.log)


app.get('/', async (req, res) => {
    res.send('Resale website is running')
})

app.listen(port, () => console.log(`Resales portal running on ${port}`))