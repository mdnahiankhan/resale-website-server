const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const optionsBrandCollection = client.db('resalesDokan').collection('options');
        app.get('/products', async (req, res) => {
            const query = {}
            const product = await productsCollection.find(query).toArray();
            res.send(product);
        })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await productsCollection.find(filter).toArray();
            res.send(result)
        })
        app.get('/options', async (req, res) => {
            const query = {}
            const option = await optionsBrandCollection.find(query).toArray();
            res.send(option);
        })
        // app.get('/options/:id', async (req, res) => {
        //     const id = req.params.id
        //     const filter = { category_id: id }
        //     const result = await optionsBrandCollection.findOne(filter)
        //     res.send(result)
        // })


    }
    finally {

    }
}
run().catch(console.log)

const options = require('./data/catagories.json')

app.get('/options', (req, res) => {
    res.send(options)
})
app.get('/options/:id', async (req, res) => {
    const id = req.params.id
    const category_id = options.filter(option => option.category_id === id);
    res.send(category_id)
})

app.get('/', async (req, res) => {
    res.send('Resale website is running')
})

app.listen(port, () => console.log(`Resales portal running on ${port}`))