# Create new JIRA ticket: $ARGUMENTS

Ticket creation workflow:

1. Analyze current development phase and requirements
2. Create appropriately detailed JIRA ticket with:
   - Clear title and description
   - Acceptance criteria
   - Story points estimation
   - Appropriate labels and components
   - Link to related tickets if applicable
3. Set priority and assignee
4. Add to current sprint if applicable
5. Create ticket in "To Do" status

Ticket types:

- story: Feature development work
- bug: Bug fixes and issues
- task: Technical tasks and improvements

Usage: /create-ticket story "User can create sales orders"
Usage: /create-ticket bug "Stock validation not working"
Usage: /create-ticket task "Set up CI/CD pipeline"
