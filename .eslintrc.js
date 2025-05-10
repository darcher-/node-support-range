import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import jsdoc from 'eslint-plugin-jsdoc'
import globals from 'globals'

/** @type {import('eslint').Linter.Config[]} */
export const eslintConfig = [
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 2022,
            globals: {
                ...globals.node,
                ...globals.es2022,
            },
        },
        plugins: { jsdoc },
        rules: {
            ...eslint.configs.recommended.rules,
            'no-unused-vars': 'warn',
            'no-console': 'off',
            'no-undef': 'warn',
            'jsdoc/require-description': 'error',
            'jsdoc/check-values': 'error',
            'jsdoc/require-jsdoc': [
                'warn',
                {
                    publicOnly: true,
                    enableFixer: false,
                    require: {
                        ArrowFunctionExpression: true,
                        FunctionDeclaration: true,
                        MethodDefinition: true,
                    },
                },
            ],
        },
    },
    { ignores: ['node_modules/**/*', 'dist/**/*'] },
    eslintConfigPrettier,
]

export default eslintConfig