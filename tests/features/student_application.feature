Feature: Student Application

  Scenario: Student applies to a lab
    Given I am logged in as a student
    And I am on the landing page
    When I click on a post
    And I click the "Apply" button
    Then I should see "Application submitted"
