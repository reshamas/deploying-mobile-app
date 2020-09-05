import * as Linking from 'expo-linking';

export default {
  prefixes: [Linking.makeUrl('/')],
  config: {
    screens: {
      Root: {
        screens: {
          TabHome: {
            screens: {
              HomeScreen: 'one',
            },
          },
          TabAbout: {
            screens: {
              AboutScreen: 'two',
            },
          },
          TabDebug: {
            screens: {
              DebugScreen: 'three',
            },
          },
        },
      },
      NotFound: '*',
    },
  },
};
