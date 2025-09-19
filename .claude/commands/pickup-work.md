# Pick up JIRA work item: $ARGUMENTS

Workflow automation:

1. Search for available JIRA tickets in "To Do" status
2. Display ticket details for selection
3. Move selected ticket to "In Progress"
4. Create feature branch following naming convention:
   - Story: feat/CCS-XXX-short-description
   - Bug: fix/CCS-XXX-short-description
   - Task: chore/CCS-XXX-short-description
5. Checkout new branch
6. Add initial commit with JIRA ticket reference
7. Post comment to JIRA ticket with branch information
8. Update JIRA ticket with development start time

Usage: /pickup-work
Usage: /pickup-work CCS-123
Usage: /pickup-work "user authentication"
