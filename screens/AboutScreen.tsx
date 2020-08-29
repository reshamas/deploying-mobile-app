import * as React from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '../components/Themed';
import Markdown from 'react-native-markdown-display';
import {AppConfig} from  "../config"

export default function AboutScreen() {
  return (
    <View style={styles.container}>

      <Markdown>
            {AppConfig.description}
          </Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 5,
    height: 1,
    width: '90%',
  },
});
