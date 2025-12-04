Feature: User Login

  Scenario: Successful login with valid credentials
    Given I am on the "login" page
    When I enter email "jynx@ucla.edu" and password "jynxjynx"
    And I click the "Sign In" button
    Then I should be on the "landing" page
    And I should see "Logout"
