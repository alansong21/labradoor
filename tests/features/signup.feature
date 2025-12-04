Feature: User Signup

  Scenario: Successful signup
    Given I am on the "signup" page
    When I enter signup email "newuser@example.com" and password "password123" and name "New User"
    And I click the "Sign Up" button
    Then I should be redirected to the verify signup page

  Scenario: Signup with existing email
    Given I am on the "signup" page
    When I enter signup email "jynx@ucla.edu" and password "password123" and name "Existing User"
    And I click the "Sign Up" button
    Then I should see "User already exists"
