const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const moment = require('moment'); // Import moment

const app = express();
const port = 3000;

// Parse JSON bodies
app.use(express.json()); // Use express.json() instead of body-parser

// M-Pesa credentials and endpoint
const consumerKey = 'o2vuiGM08M5PA8zTHHVAyWLr0ivZlTBmfKo32NGMQdb2MhGG';
const consumerSecret = 'c8Wh9DcHPrf8TX7VqRNyPevPtftVwUHrNC7JiDXn2dHz77K5jLV37e6YNDfzlYxT';
const lipaNaMpesaShortcode = '174379';
const lipaNaMpesaPasskey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const lipaNaMpesaCallbackUrl = 'https://mydomain.com/path';

// Endpoint to initiate payment
app.post('/pay', async (req, res) => {
    const phoneNumber = req.body.phoneNumber; // Customer's phone number
    const amount = req.body.amount; // Amount to be paid

    const auth = 'Basic ' + Buffer.from(consumerKey + ':' + consumerSecret).toString('base64');

    // M-Pesa request payload
    const payload = {
        BusinessShortCode: lipaNaMpesaShortcode,
        Password: Buffer.from(lipaNaMpesaShortcode + lipaNaMpesaPasskey + moment().format('YYYYMMDDHHmmss')).toString('base64'),
        Timestamp: moment.utc().format('YYYYMMDDHHmmss'),
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: lipaNaMpesaShortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: lipaNaMpesaCallbackUrl,
        AccountReference: 'MyKiosk',
        TransactionDesc: 'Payment for goods.'
    };

    try {
        const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', payload, {
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/json'
            }
        });
        console.log('Response from M-Pesa:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error making request:', error);
        res.status(500).json({ error: 'Could not initiate payment' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
