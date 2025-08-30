# Frequently Asked Questions (FAQ)

## General Questions

### What is JBTestSuite?
JBTestSuite is a full-stack web automation testing platform that combines browser automation with AI-powered test generation and analysis. It provides a comprehensive solution for creating, managing, and executing web application tests with real-time monitoring and intelligent insights.

### What technologies does JBTestSuite use?
- **Frontend**: React 18 + TypeScript + TanStack Router + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy 2.0 + PostgreSQL 16
- **Automation**: Selenium WebDriver with Chromium browser
- **AI**: OpenAI API (ChatGPT + GPT-4 Vision)
- **Infrastructure**: Docker Compose for service orchestration

### Do I need programming experience to use JBTestSuite?
Basic technical knowledge is helpful, but the platform is designed to be user-friendly:
- **No coding required** for basic test case creation and management
- **AI assistance** helps generate test scenarios from natural language descriptions
- **Visual interface** for most operations
- **Programming knowledge helpful** for advanced customizations and integrations

## Installation and Setup

### What are the system requirements?
- **Docker**: Docker Desktop or Docker Engine with Docker Compose
- **Memory**: Minimum 4GB RAM, recommended 8GB+
- **Storage**: At least 5GB free disk space
- **Network**: Internet connection for AI features and dependency downloads
- **Browser**: Modern web browser for accessing the interface

### Why use Docker instead of native installation?
- **Consistency**: Identical environment across different systems
- **Isolation**: No conflicts with existing software
- **Easy setup**: Single command to start all services
- **Resource management**: Better control over service dependencies
- **Scalability**: Easy to add more browser instances or services

### Can I run JBTestSuite without Docker?
Yes, but it's more complex:
- You'll need to manually install and configure PostgreSQL, Selenium Grid, and all dependencies
- Environment setup varies by operating system
- More difficult to maintain consistency
- Docker is the recommended approach for most users

### How do I access the application after installation?
- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Selenium Grid**: http://localhost:4444 (optional, for monitoring browser sessions)

## Test Management

### What's the difference between `/tests/new` and `/tests/create`?
Both routes create new test cases with identical functionality:
- **`/tests/new`**: Simple, streamlined interface focused on quick test creation
- **`/tests/create`**: Enhanced interface with additional layout features
- Both have the same fields, validation, and capabilities
- Choose based on your preference for interface complexity

### How do I organize my test cases effectively?
- **Categories**: Use appropriate categories (Functional, Regression, Smoke, etc.)
- **Tags**: Add descriptive tags for filtering and grouping
- **Naming**: Use consistent, descriptive naming conventions
- **Priority**: Set appropriate priority levels for execution ordering
- **Description**: Include clear descriptions of what each test validates

### What test categories are available?
- **Functional**: Feature and functionality testing
- **Regression**: Bug verification and re-testing
- **Smoke**: Critical path and basic functionality tests
- **Integration**: Cross-system and API testing
- **Unit**: Component-level testing
- **Performance**: Load and performance testing
- **Security**: Security and authentication testing
- **Usability**: User experience and interface testing

### How do tags work in test cases?
- **Creation**: Type tag name and press Enter or click "Add"
- **Removal**: Click the × button on any tag
- **Filtering**: Use tags to filter test lists (feature planned)
- **Organization**: Group related tests with common tags
- **Best practices**: Use consistent tag vocabulary across your team

## Test Execution

### How does browser automation work?
JBTestSuite uses Selenium WebDriver with a Chromium browser running in a Docker container:
- **Isolated environment**: Each test runs in a clean browser session
- **Screenshot capture**: Automatic screenshots during key test steps
- **Real-time monitoring**: Live view of browser actions via WebSocket
- **Headless operation**: Browser runs without GUI for faster execution
- **Resource management**: Automatic cleanup after test completion

### Can I see the browser while tests are running?
- **Live screenshots**: Real-time screenshot capture during execution
- **WebSocket updates**: Live progress monitoring in the web interface
- **VNC access**: Connect to selenium container for direct browser viewing (advanced)
- **Artifacts**: All screenshots saved for post-execution review

### Why do my tests sometimes fail randomly?
Common causes of flaky tests:
- **Timing issues**: Page elements not fully loaded before interaction
- **Dynamic content**: Elements that change position or state
- **Network delays**: Slow responses from external services
- **Resource constraints**: Insufficient memory or CPU during execution
- **Solutions**: Increase retry counts, improve wait strategies, isolate test data

### How do I debug test failures?
1. **Check screenshots**: Visual evidence of what went wrong
2. **Review logs**: Detailed execution logs with error messages
3. **Examine timing**: Look for timeout or timing-related issues
4. **Validate selectors**: Ensure element selectors are still valid
5. **Test environment**: Verify target application is accessible and functional

## AI Features

### Do I need an OpenAI API key?
- **Required for AI features**: Test generation, screenshot analysis, intelligent insights
- **Optional for basic features**: Test execution, management, and monitoring work without AI
- **Setup**: Add your API key to environment variables
- **Cost**: OpenAI charges based on API usage

### How accurate is AI-generated content?
- **Test cases**: Generally good starting point, requires human review
- **Screenshot analysis**: High accuracy for basic UI validation
- **Recommendations**: Useful suggestions, but validate before implementing
- **Continuous improvement**: AI responses improve with better prompts and context

### Can I use JBTestSuite without AI features?
Yes, absolutely:
- **Core functionality**: Test management and execution work independently
- **Manual test creation**: Create test cases using the web interface
- **Traditional automation**: Standard Selenium automation without AI assistance
- **Selective use**: Enable AI features only when needed

### How much does OpenAI API usage cost?
- **Variable costs**: Based on tokens consumed (input and output)
- **Typical usage**: $5-50/month for moderate testing activities
- **Control costs**: Monitor usage, set limits, cache results when possible
- **Free tier**: OpenAI provides some free credits for new accounts

## Performance and Scaling

### How many tests can I run simultaneously?
- **Default**: 1-2 concurrent browser sessions
- **Scaling**: Add more Selenium containers for parallel execution
- **Resource dependent**: Limited by available CPU and memory
- **Configuration**: Adjust Docker Compose for more containers

### Why is my test execution slow?
Common performance factors:
- **Resource constraints**: Insufficient CPU or memory
- **Network latency**: Slow responses from target applications
- **Test design**: Inefficient wait strategies or unnecessary steps
- **Container overhead**: Docker container startup time
- **Solutions**: Optimize tests, increase resources, use test parallelization

### Can I run JBTestSuite in production?
The current version is designed for development and testing environments:
- **Security**: Add authentication and authorization for production use
- **Scaling**: Implement proper load balancing and resource management
- **Monitoring**: Add comprehensive logging and monitoring
- **Backup**: Implement database backup and disaster recovery

## Troubleshooting

### The application won't start after installation
1. **Check Docker status**: Ensure Docker is running
2. **Port conflicts**: Check if ports 3000, 8000, 5432, or 4444 are in use
3. **Resource limits**: Ensure sufficient memory and disk space
4. **Network connectivity**: Verify internet connection for downloads
5. **Logs**: Check `docker-compose logs` for specific error messages

### I can't connect to the database
- **Container status**: Verify postgres container is running and healthy
- **Network connectivity**: Ensure containers can communicate
- **Configuration**: Check DATABASE_URL environment variable
- **Permissions**: Verify database user permissions and credentials
- **Logs**: Check postgres container logs for connection errors

### Tests fail with "Element not found" errors
- **Timing**: Add explicit waits for elements to load
- **Selectors**: Verify CSS selectors are correct and unique
- **Page state**: Ensure page is fully loaded before element interaction
- **Dynamic content**: Account for elements that load asynchronously
- **Screenshots**: Check captured screenshots to see actual page state

### WebSocket connection keeps dropping
- **Network stability**: Check internet connection stability
- **Proxy settings**: Configure proxy to support WebSocket connections
- **Resource limits**: Monitor server memory and CPU usage
- **Browser limits**: Some browsers limit WebSocket connections
- **Firewall**: Ensure WebSocket traffic isn't blocked

### AI features aren't working
- **API key**: Verify OpenAI API key is correctly configured
- **Network access**: Ensure server can reach OpenAI API endpoints
- **Usage limits**: Check if you've exceeded OpenAI rate limits
- **Account status**: Verify OpenAI account is active and has credits
- **Logs**: Check server logs for specific API error messages

## Integration and Development

### Can I integrate JBTestSuite with CI/CD pipelines?
- **API access**: Use REST API for programmatic test execution
- **Docker integration**: Run containers in CI/CD environments
- **Exit codes**: Tests return appropriate codes for pipeline decisions
- **Artifacts**: Export results and screenshots for pipeline artifacts
- **Webhooks**: Planned feature for integration callbacks

### How do I backup my test data?
- **Database backup**: Use PostgreSQL backup tools (`pg_dump`)
- **Docker volumes**: Back up Docker volumes containing persistent data
- **Export features**: Use API to export test cases and results
- **Configuration**: Back up environment configuration files
- **Artifacts**: Copy screenshot and test artifact directories

### Can I customize the user interface?
- **Limited customization**: Current version has fixed UI layout
- **Theming**: CSS customization possible with code changes
- **Component modification**: React components can be modified
- **API integration**: Build custom interfaces using the REST API
- **Future plans**: More customization options planned for future releases

### How do I contribute to the project?
- **Issues**: Report bugs and feature requests on the project repository
- **Code contributions**: Submit pull requests following contribution guidelines
- **Documentation**: Help improve and expand documentation
- **Testing**: Test new features and report feedback
- **Community**: Participate in discussions and help other users

## Getting Help

### Where can I get additional support?
- **Documentation**: Comprehensive guides in the `/docs` directory
- **API Reference**: Interactive API documentation at `/docs` endpoint
- **Troubleshooting**: Common issues guide with solutions
- **Community**: Project discussions and user community
- **Issues**: Bug reports and feature requests on project repository

### How do I report bugs or request features?
- **GitHub Issues**: Use the project repository issue tracker
- **Clear descriptions**: Provide detailed steps to reproduce bugs
- **Environment info**: Include system information and configuration
- **Screenshots**: Visual evidence helps with UI-related issues
- **Logs**: Include relevant error logs and stack traces

---

*Don't see your question? Check the [Common Issues](common-issues.md) guide or [User Guide](../user-guide.md) for more detailed information.*