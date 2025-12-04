Feature: Verify Signup

  Scenario: Successful verification
    Given I visit the verify signup page with token "valid_token"
    Then I should see "Email Verified!"

  Scenario: Invalid verification code
    Given I visit the verify signup page with token "invalid_token"
    Then I should see "Verification Failed"
