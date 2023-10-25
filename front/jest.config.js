module.exports = {
  configure: {
    moduleNameMapper: {
      '~/(.+)': "<rootDir>/src/$1",
      '@/(.+)': "<rootDir>/src/modules/$1",
    }
  },
};