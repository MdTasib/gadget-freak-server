const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
	res.send("hello world");
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.do24a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

async function run() {
	try {
		await client.connect();
		const collection = client.db("gadget").collection("products");
		const orderCollection = client.db("gadget").collection("orders");

		// user is login, then generate a jwt token
		app.post("/login", async (req, res) => {
			const email = req.body;
			const token = jwt.sign(email, process.env.JWT_TOKEN);
			res.send({ token });
		});

		// get all data
		app.get("/products", async (req, res) => {
			const products = await collection.find({}).toArray();
			res.send(products);
		});

		// post data
		app.post("/uploadPd", async (req, res) => {
			const product = req.body;
			const tokenInfo = req.headers.authorization;
			const [email, accessToken] = tokenInfo.split(" ");

			const decoded = verifyToken(accessToken);
			console.log(decoded);

			if (email === decoded.email) {
				const result = await collection.insertOne(product);
				res.send({ success: "Product uploaded successfully" });
			} else {
				res.send({ success: "UnAuthoraized Access" });
			}
		});

		// add order
		app.post("/addOrder", async (req, res) => {
			const orderInfo = req.body;
			const result = await orderCollection.insertOne(orderInfo);
			res.send({ success: "order complete" });
		});

		// load order filtering email
		app.get("/orderList", async (req, res) => {
			const tokenInfo = req.headers.authorization;
			const [email, accessToken] = tokenInfo.split(" ");

			const decoded = verifyToken(accessToken);
			console.log(decoded);

			if (email === decoded.email) {
				const orders = await orderCollection.find({ email: email }).toArray();
				res.send(orders);
			} else {
				res.send({ success: "UnAuthoraized Access" });
			}
		});
	} finally {
	}
}

run().catch(console.dir);

app.listen(port, console.log("server runing"));

// verify token function
function verifyToken(token) {
	let email;
	jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
		if (err) {
			email = "Invalid email";
		}
		if (decoded) {
			console.log(decoded);
			email = decoded;
		}
	});
	return email;
}
