const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Configuration, OpenAIApi } = require("openai");
const winston = require('winston');

require('dotenv').config()

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'bot.log' }),
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
});

const client = new Client();

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    logger.info('Client is ready!');
});

client.initialize();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

client.on('message', message => {
    if (message.from.startsWith('1')) {
        if (message.body.startsWith('/')) {
            runCompletion(message.body.substring(1)).then(result => message.reply(result));
        }
    } else {
        runCompletion(message.body).then(result => message.reply(result));
    }
});

async function runCompletion (text) {
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-16k",
        messages: [{'role': 'user', 'content': text}]
    });
    return completion.data.choices[0].message.content;
}
