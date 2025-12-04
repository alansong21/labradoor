Feature: Post Creation and Viewing

  Scenario: Researcher creates a new post
    Given I am logged in as a researcher
    And I am on the "create post" page
    When I fill in the post details
    And I click the "Create Post" button
    Then I should be redirected to the "my posts" page
    And I should see the new post in the list

  Scenario: Student views posts
    Given I am logged in as a student
    And I am on the landing page
    Then I should see a list of available research posts
