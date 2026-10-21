// loaded by mocha before the tests (see .mocharc.json): use the test configuration, with its own database
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
