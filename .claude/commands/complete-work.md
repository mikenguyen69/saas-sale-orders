# Complete work and create PR: $ARGUMENTS

End-to-end completion workflow:

1. Run quality checks (/quality command)
2. Ensure all tests pass
3. Create pull request with:
   - JIRA ticket reference in title
   - Detailed description linking to JIRA
   - Testing notes and checklist
4. Update JIRA ticket with PR link
5. Move JIRA ticket to "In Review" status
6. Send Slack notification with PR and JIRA links
7. Add PR reviewers based on team configuration

Usage: /complete-work
Usage: /complete-work "ready for review with comprehensive tests"
