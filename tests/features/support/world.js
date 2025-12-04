const { setWorldConstructor, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');

setDefaultTimeout(30 * 1000);

class CustomWorld {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async openBrowser() {
        this.browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

setWorldConstructor(CustomWorld);

Before(async function () {
    await this.openBrowser();
});

After(async function () {
    await this.closeBrowser();
});
