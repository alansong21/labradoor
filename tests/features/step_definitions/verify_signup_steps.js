const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

Given('I visit the verify signup page with token {string}', async function (token) {
    await this.page.goto(`http://localhost:3000/verify-signup?token=${token}`);
});
