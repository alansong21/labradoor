const { Given, When, Then, After, Before, setDefaultTimeout } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');
const { expect } = require('chai');

setDefaultTimeout(20 * 1000);

let browser;
let page;

Before(async function () {
    browser = await puppeteer.launch({ headless: "new" });
    page = await browser.newPage();
});

After(async function () {
    if (browser) {
        await browser.close();
    }
});

Given('I am on the login page', async function () {
    await page.goto('http://localhost:3000/login');
});

When('I enter email {string} and password {string}', async function (email, password) {
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
});

When('I click the Sign In button', async function () {
    await Promise.all([
        page.waitForNavigation(),
        page.click('button[type="submit"]'),
    ]);
});

Then('I should be redirected to the landing page', async function () {
    await page.waitForNavigation(); // Ensure navigation completes
    const url = page.url();
    expect(url).to.equal('http://localhost:3000/');
});

Then('I should see {string} in the navbar', async function (text) {
    const content = await page.content();
    expect(content).to.include(text);
});
