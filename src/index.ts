import express from "express";
import Stripe from "stripe";
import "dotenv/config";
const jwt = require("jsonwebtoken");
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Stripe secret key not found");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
  typescript: true,
});

const app = express();
app.use(express.json());

app.post("/create-customer", async (req, res) => {
  const customer = await stripe.customers.create({
    email: req.body.email,
  });
  res.send({ customerId: customer.id });
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;
    //What shall we do to store customer Id in our database?

    // Use an existing Customer ID if this is a returning customer.
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2022-11-15" }
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, //Amount in cents
      currency: "aed",
      payment_method_types: ["card"],
    });
    res.send({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });
  } catch (error: any) {
    //Handle error response
    console.log("Error while creating payment intent", error?.message);
    res.status(500).send("Error in creating payment intent");
  }
});

app.get("/", (req, res) => {
  res.send("Hello, World from stripe server!");
});

app.listen(3000, () => {
  console.log("Stripe Server listening on port 3000");
});

app.get("videosdk/get-token", (req, res) => {
  //validation for api key and secret
  if (!process.env.VIDEOSDK_API_KEY || !process.env.VIDEOSDK_API_SECRET) {
    return res.status(500).send("VideoSDK API key or secret not found");
  }
  const options = {
    expiresIn: "10m",
    algorithm: "HS256",
  };
  const payload = {
    apikey: process.env.VIDEOSDK_API_KEY,
    permissions: [`allow_join`], // `ask_join` || `allow_mod`
    version: 2,
    roles: ["CRAWLER"],
  };

  const token = jwt.sign(payload, process.env.VIDEOSDK_API_SECRET, options);
  return res.status(200).send({ videoSdkToken: token });
});
