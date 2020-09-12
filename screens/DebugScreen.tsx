import * as React from 'react';
import { StyleSheet } from 'react-native';

import { View, Text} from '../components/Themed';
import Markdown from 'react-native-markdown-display';
import {AppConfig} from  "../config"
import {getColor} from "../components/Themed"
export default function DebugScreen() {
  const color = getColor('text')
  const modelClasses = require("../assets/model_tfjs/classes.json")

  return (
    <View style={styles.container}>
        <View style={{}}>
          <Text h2 >Classes</Text>
        </View>

       <View>
          {modelClasses.map(p => {
            return (
              <View key={p} >
                <Text>{p}</Text>
              </View>
            );
          })}
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10
  }
  

});
