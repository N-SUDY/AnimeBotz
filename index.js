#!/usr/bin/env node

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const fs = require('fs-extra');
const { promisify } = require('util');
const { randomBytes } = require('crypto');
const settings = require('./settings.json');
const token = settings.telegram_bot_token;
const PORT = process.env.PORT || 3000;
const bot = new TelegramBot(token, { polling: true });
const random = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ23456789'.split('');

let startTime = new Date();

function generateRandomString(len) {
    const result = [];
    for (let i = 0; i < len; i++) result.push(random[Math.floor(Math.random() * random.length)]);
    return result.join('');
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Welcome To Anime Botz! \nType /menu to see available options.");
});

bot.onText(/\/menu/, (msg) => {
    const chatId = msg.chat.id;
    const message = "Choose an option :\n" +
    "/wallpaper - Get anime wallpaper\n" +
    "/waifu - Get SFW waifu image\n" +
    "/nsfw - Get NSFW waifu image (18+)";
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'WhatsApp', url: 'https://wa.me/6285225416745' },
                    { text: 'Telegram', url: 'https://t.me/RidwanzSaputra' }
                ]
            ]
        }
    };
    bot.sendMessage(chatId, message, options);
});

bot.onText(/\/runtime/, (msg) => {
    const chatId = msg.chat.id;
    const currentTime = new Date();
    const runtimeSeconds = Math.floor((currentTime - startTime) / 1000);
    const days = Math.floor(runtimeSeconds / (3600 * 24));
    const hours = Math.floor((runtimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((runtimeSeconds % 3600) / 60);
    const seconds = runtimeSeconds % 60;
    const message = `Bot has been running for :\n${days} days, ${hours} hours, ${minutes} minutes ${seconds} seconds.`;
    bot.sendMessage(chatId, message);
});

bot.onText(/\/wallpaper/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const imageUrl = await getRandomImage('https://nekos.life/api/v2/img/wallpaper');
        sendImage(chatId, imageUrl);
    } catch (error) {
        bot.sendMessage(chatId, 'Failed to fetch wallpaper image.');
    }
});

bot.onText(/\/waifu/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const imageUrl = await getRandomImage('https://api.waifu.pics/sfw/waifu');
        sendImage(chatId, imageUrl);
    } catch (error) {
        bot.sendMessage(chatId, 'Failed to fetch waifu image.');
    }
});

bot.onText(/\/nsfw/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const imageUrl = await getRandomImage('https://api.waifu.pics/nsfw/waifu');
        sendImage(chatId, imageUrl);
    } catch (error) {
        bot.sendMessage(chatId, 'Failed to fetch NSFW waifu image.');
    }
});

async function getRandomImage(apiUrl) {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.url;
}

async function sendImage(chatId, imageUrl) {
    try {
        await bot.sendChatAction(chatId, 'upload_photo');
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        const fileName = generateRandomString(5) + '.jpg';
        await promisify(fs.writeFile)(fileName, buffer);
        await bot.sendPhoto(chatId, fileName);
        await promisify(fs.unlink)(fileName);
    } catch (error) {
        bot.sendMessage(chatId, 'Failed to send image.');
    }
}

bot.setMyCommands([
  {
    command: '/menu',
    description: 'Show available options'
  },
  {
    command: '/runtime',
    description: 'Show bot runtime'
  },
]);

const app = express();

app.use(express.json());

app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});