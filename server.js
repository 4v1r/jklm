const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'https://jklmfun.netlify.app',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.text());
app.use(express.static('.'));

app.post('/request_add.txt', async (req, res) => {
    try {
        const word = req.body + '\n';
        await fs.appendFile('request_add.txt', word);
        res.sendStatus(200);
    } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
        res.sendStatus(500);
    }
});

app.post('/request_withdraw.txt', async (req, res) => {
    try {
        const word = req.body + '\n';
        await fs.appendFile('request_withdraw.txt', word);
        res.sendStatus(200);
    } catch (error) {
        console.error('Erreur lors du retrait:', error);
        res.sendStatus(500);
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});
