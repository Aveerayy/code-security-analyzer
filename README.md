# Code Security Analyzer

A tool for analyzing code and architecture diagrams for security vulnerabilities.

## Features

- Processes code and architecture diagrams to identify security issues
- Implements component-based chunking for efficient analysis
- Uses OpenAI's models to identify potential security vulnerabilities
- Produces comprehensive security reports based on STRIDE threat model
- Handles batch processing to accommodate large codebases

## Setup

1. Clone the repository:
```bash
git clone https://github.com/Aveerayy/code-security-analyzer.git
cd code-security-analyzer
```

2. Create a `.env` file based on the example:
```bash
cp .env.example .env
# Then edit .env to add your OpenAI API key
```

3. Install dependencies:
```bash
npm install
```

4. Run the server:
```bash
node src/openai-proxy.cjs
```

The server will start on port 3001 by default.

## API Endpoints

- `POST /api/analyze-security`: Analyzes text for security vulnerabilities
- `POST /api/process-text`: Processes and chunks text
- `POST /api/openai`: Proxies requests to OpenAI API

## Architecture

The security analyzer uses a hierarchical approach to analyze large codebases:

1. Component-based chunking splits the input into logical components
2. Each component is analyzed individually
3. Results are processed in batches to avoid context length limits
4. A final summary aggregates all findings into a comprehensive report

## License

MIT
