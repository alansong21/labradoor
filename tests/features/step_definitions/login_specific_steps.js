const { When } = require('@cucumber/cucumber');

When('I enter email {string} and password {string}', async function (email, password) {
    await this.page.type('input[name="email"]', email);
    await this.page.type('input[name="password"]', password);
});
