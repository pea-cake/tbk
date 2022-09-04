module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true
    },
    "extends": "airbnb-base",
    "overrides": [
    ],
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "rules": {
        "camelcase": 0,
        "no-underscore-dangle": 0,
        "import/no-unresolved": 0,
        "indent": ['error', 4],
        "quotes": "off",
        "no-console": "off",
        "no-unused-vars": "off",
        "no-unreachable": "off",
        "no-redeclare": "warn",
        "eqeqeq":0,
        "no-await-in-loop":0,
    }
}
