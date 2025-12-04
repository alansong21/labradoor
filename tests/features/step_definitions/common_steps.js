const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

Given('I am on the {string} page', async function (pageName) {
    let path = '/';
    switch (pageName.toLowerCase()) {
        case 'landing': path = '/'; break;
        case 'login': path = '/login'; break;
        case 'signup': path = '/signup'; break;
        case 'verify signup': path = '/verify-signup'; break;
        case 'student application': path = '/student_application'; break;
        case 'admin login': path = '/admin/login'; break;
        case 'admin dashboard': path = '/admin/dashboard'; break;
        case 'create post': path = '/researcher-post-creation'; break;
        case 'my posts': path = '/my-posts'; break;
        default: path = '/';
    }
    await this.page.goto(`http://localhost:3000${path}`);
});

When('I click the {string} button', async function (buttonText) {
    // Try to find a button with the exact text, or a submit button if "Submit" or "Sign In" is generic
    const buttonSelector = `//button[contains(text(), '${buttonText}')]`;
    try {
        const [button] = await this.page.$x(buttonSelector);
        if (button) {
            await button.click();
        } else {
            // Fallback to generic submit if not found by text (common for icons or specific classes)
            // or try finding by type="submit" if the text matches common submit actions
            if (['Sign In', 'Sign Up', 'Submit', 'Verify'].includes(buttonText)) {
                await this.page.click('button[type="submit"]');
            } else {
                throw new Error(`Button with text "${buttonText}" not found`);
            }
        }
    } catch (e) {
        // Fallback for standard css selector if xpath fails or complex logic needed
        await this.page.click('button[type="submit"]');
    }
});

Then('I should see {string}', async function (text) {
    await this.page.waitForFunction(
        (text) => document.body.innerText.includes(text),
        { timeout: 5000 },
        text
    );
});

Then('I should be on the {string} page', async function (pageName) {
    await this.page.waitForNavigation().catch(() => { }); // Wait for nav if pending
    const url = this.page.url();
    let expectedPath = '/';
    switch (pageName.toLowerCase()) {
        case 'landing': expectedPath = '/'; break;
        case 'login': expectedPath = '/login'; break;
        case 'signup': expectedPath = '/signup'; break;
        case 'verify signup': expectedPath = '/verify-signup'; break;
        case 'admin dashboard': expectedPath = '/admin/dashboard'; break;
        case 'my posts': expectedPath = '/my-posts'; break;
    }
    expect(url).to.include(expectedPath);
});


Given('I am logged in as a researcher', async function () {
    // This step needs to perform a full login flow or mock the session
    await this.page.goto('http://localhost:3000/login');
    await this.page.type('input[name="email"]', 'researcher@example.com');
    await this.page.type('input[name="password"]', 'password');
    await Promise.all([
        this.page.waitForNavigation(),
        this.page.click('button[type="submit"]'),
    ]);
});

Given('I am logged in as a student', async function () {
    await this.page.goto('http://localhost:3000/login');
    await this.page.type('input[name="email"]', 'student@example.com');
    await this.page.type('input[name="password"]', 'password');
    await Promise.all([
        this.page.waitForNavigation(),
        this.page.click('button[type="submit"]'),
    ]);
});



When('I fill in the post details', async function () {
    await this.page.type('input[name="title"]', 'Test Research Project');
    await this.page.type('textarea[name="description"]', 'This is a test project description.');
    // Add other fields as necessary
});

Then('I should see the new post in the list', async function () {
    await this.page.reload();
    const content = await this.page.content();
    expect(content).to.include('Test Research Project');
});

Then('I should see a list of available research posts', async function () {
    await this.page.waitForSelector('.post-card'); // Assuming a class for post cards
    const posts = await this.page.$$('.post-card');
    expect(posts.length).to.be.greaterThan(0);
});

When('I click on a post', async function () {
    await this.page.click('.post-card:first-child');
});


