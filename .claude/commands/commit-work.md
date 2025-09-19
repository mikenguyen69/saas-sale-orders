# Commit work with JIRA integration: $ARGUMENTS

Automated commit workflow:

1. Stage current changes
2. Generate conventional commit message with JIRA reference
3. Commit changes to current branch
4. Post commit information to JIRA ticket as comment
5. Update JIRA ticket with progress notes
6. Push changes to remote branch

Commit message format:

- feat(CCS-123): add user authentication form
- fix(CCS-124): resolve login validation issue
- chore(CCS-125): update dependencies

Usage: /commit-work "add order form validation"
Usage: /commit-work "fix stock calculation bug"
