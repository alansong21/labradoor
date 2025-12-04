const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

When('I enter signup email {string} and password {string} and name {string}', async function (email, password, name) {
    await this.page.type('input[name="email"]', email);
    await this.page.type('input[name="password"]', password);
    await this.page.type('input[name="confirmPassword"]', password);
    await this.page.type('input[name="name"]', name);
});

Then('I should be redirected to the verify signup page', async function () {
    await this.page.waitForNavigation();
    const url = this.page.url();
    expect(url).to.include('/verify-signup');
});
