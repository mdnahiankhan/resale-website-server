const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;


const app = express();

/* Middleware */
app.use(cors())
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kzjjck3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unAuthorized Access')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const productsCollection = client.db('resalesDokan').collection('products');
        const optionsBrandCollection = client.db('resalesDokan').collection('options');
        const bookingsCollection = client.db('resalesDokan').collection('bookings');
        const usersCollection = client.db('resalesDokan').collection('users');
        const sellersCollection = client.db('resalesDokan').collection('sellers');
        const addproductsCollection = client.db('resalesDokan').collection('addproducts');

        /* verify admin */
        const verifyAdmin = async (req, res, next) => {
            console.log('inside the verify admin', req.decoded.email);
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const sellers = await sellersCollection.findOne(query);
            if (sellers?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        /* products collection api */

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

        app.get('/productsName', async (req, res) => {
            const query = {};
            const result = await productsCollection.find(query).project({ name: 1 }).toArray();
            res.send(result)
        })

        /* add products collection */

        app.get('/addproducts', verifyJwt, verifyAdmin, async (req, res) => {
            const query = {};
            const addProducts = await addproductsCollection.find(query).toArray();
            res.send(addProducts);
        })

        app.post('/addproducts', verifyJwt, async (req, res) => {
            const addProducts = req.body;
            const result = await addproductsCollection.insertOne(addProducts);
            res.send(result)
        })
        app.delete('/addproducts/:id', verifyJwt, async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await addproductsCollection.deleteOne(filter);
            res.send(result)
        })


        /* options collection api*/

        app.get('/options', async (req, res) => {
            const query = {}
            const option = await optionsBrandCollection.find(query).toArray();
            res.send(option);
        })
        app.get('/options/:id', async (req, res) => {
            const category_id = req.params.id
            const filter = { category_id: category_id }
            const result = await optionsBrandCollection.find(filter).toArray()
            res.send(result)
        })
        /* bookings collection api*/

        app.get('/bookings', verifyJwt, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const query = { email: email }
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings)
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                email: booking.email,
                car_names: booking.car_names
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = `You already have booked this ${booking.car_names}`
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

        /* users collection api and jwt token */

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' });
        })

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray()
            res.send(users)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        /* sellers api  */

        app.get('/sellers', async (req, res) => {
            const query = {};
            const seller = await sellersCollection.find(query).toArray();
            res.send(seller);
        })

        app.get('/sellers/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await sellersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        app.post('/sellers', async (req, res) => {
            const sellers = req.body;
            const resutls = await sellersCollection.insertOne(sellers);
            res.send(resutls)
        })

        app.put('/sellers/admin/:id', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const sellers = await sellersCollection.findOne(query);
            if (sellers?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await sellersCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
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