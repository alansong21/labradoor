const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

When('I enter admin credentials', async function () {
    await this.page.type('input[name="email"]', 'admin@labradoor.com');
    await this.page.type('input[name="password"]', 'adminsecret');
});
