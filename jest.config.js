module.exports = {
    globals: {
        "ts-jest": {
            "diagnostics": false
        }
    },
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/lib/**/*.{ts,tsx}',
        '!**/coverage/**',
        '!**/dist/**',
        '!**/jest.config.js',
        '!**/node_modules/**',
        '!**/test/**',
        '!**/lib/index.ts'
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: [
        'cobertura',
        'html',
        'lcov'
    ],
    moduleFileExtensions: [
        'ts',
        'tsx',
        'json',
        "js"
    ],
    rootDir: '.',
    reporters: [
        'default', ['jest-junit', {
            suiteName: 'typeorm-encrypt-jsoncolumn',
            outputDirectory: '<rootDir>/coverage',
            outputName: 'junit.xml',
            classNameTemplate: '{classname}-{title}',
            titleTemplate: '{classname}-{title}',
            ancestorSeparator: ' › ',
            usePathForSuiteName: 'true'
        }]
    ],
    testEnvironment: 'node',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
    },
    verbose: true
}