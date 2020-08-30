import * as React from 'react';
import { StyleSheet } from 'react-native';

import { View } from '../components/Themed';
import Markdown from 'react-native-markdown-display';
import {AppConfig} from  "../config"
import {getColor} from "../components/Themed"
export default function AboutScreen() {
  const color = getColor('text')
  return (
    <View style={styles.container}>

      <Markdown  style={{
                body: {color: color},
              
              }}>
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
  }
  

});
