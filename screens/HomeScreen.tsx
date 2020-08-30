import * as React from 'react';

//import { Text, View } from '../components/Themed';

import * as Permissions from 'expo-permissions'
import * as tf from '@tensorflow/tfjs';
import * as jpeg from 'jpeg-js'


import {
  Image,
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  ImageSourcePropType,
} from 'react-native';
import {AppConfig} from "../config"


import {Text, Icon, ListItem} from 'react-native-elements';


import * as ImagePicker from 'expo-image-picker';
import { ModelService } from '../components/ModelService';


type State = {
  image: ImageSourcePropType; 
  loading:boolean;
  isTfReady: boolean;
  isModelReady: boolean;
  predictions: ModelPrediction[]|null;
};

export default class HomeScreen extends React.Component<{},State> {
  static navigationOptions = {
    header: null,
  };

  state:State = {
      image: {},
      loading: false,
      isTfReady: false,
      isModelReady: false,
      predictions: null
  }

  modelService!:ModelService;

  async componentDidMount() {
    this.modelService = await ModelService.create();
    this.modelService.intialize();
    this.setState({ isTfReady: true,isModelReady: true });
  }

  render() {

    const modelLoadingStatus = this.state.isModelReady ? "✅" : "❓";
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.container} >

                <View style={styles.titleContainer}>
                    <Text h1>{AppConfig.title}</Text>
                </View>


                <View>
                  <Text>Model Status: {modelLoadingStatus}</Text>
                </View>

                <View style={styles.actionsContainer}>
                    <View style={styles.callToActionContainer}>
                        <Icon name='camera-alt' raised onPress={this._pickImageFromCamera}/>
                        <Icon name='image' raised onPress={this._pickImageFromLibrary}/>
                    </View>
                </View>

                <View style={styles.imageContainer}>
                    <Image source={this.state.image} style={{height: 200, width: 200}}/>
                </View>


                <View style={styles.predictionsContainer}>
                    {this.renderPredictions()}
                </View>
            </View>

        </ScrollView>
    );
  }


  renderPredictions() {

      if (this.state.loading) {
          return <ActivityIndicator size="large" color="#0000ff"/>
      }
      let predictions= this.state.predictions || [];
      if (predictions.length > 0) {
          return (
              <View style={styles.predictionsContentContainer}>
                  <Text h3>Predictions</Text>
                  <View>
                      {
                          predictions.map((item, index) => (
                              <ListItem
                                  key={index}
                                  title={item.className}
                                  subtitle={`prob: ${item.probability.toFixed(3)}`} hideChevron={true}
                              />
                          ))
                      }
                  </View>

              </View>
          )
      } else {
          return null
      }
  }


  _verifyPermissions = async () => {
      console.log("Verifying Permissions");
      const { status, expires, permissions } = await Permissions.getAsync(Permissions.CAMERA, Permissions.CAMERA_ROLL);

      if (status !== 'granted') {
          const { status, permissions }  = await Permissions.askAsync(Permissions.CAMERA, Permissions.CAMERA_ROLL)
        
          if (status === 'granted') {
              console.log("Permissions granted");
              return true
          } else {
              alert('Hey! You have not enabled selected permissions');
              return false
          }

      }else{
          return true;
      }
  };

  _pickImageFromLibrary = async () => {
      const status = await this._verifyPermissions();

      try {
        let response = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          aspect: [4, 3]
        })

        if (!response.cancelled) {
          const source = { uri: response.uri }

          this.setState({ image: source })
          this._classifyImage()
        }
      } catch (error) {
        console.log(error)
      }

  };

  _pickImageFromCamera = async () => {
      const status = await this._verifyPermissions();

      try {

        let response = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3]
        });

        if (!response.cancelled) {
          const source = { uri: response.uri }
          this.setState({ image: source })
          this._classifyImage()
        }
    }  catch (error) {
      console.log(error)
    }

  };

  imageToTensor___(rawImageData:any) {
    const TO_UINT8ARRAY = true
    const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY)
    // Drop the alpha channel info for mobilenet
    const buffer = new Uint8Array(width * height * 3)
    let offset = 0 // offset into original data
    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = data[offset]
      buffer[i + 1] = data[offset + 1]
      buffer[i + 2] = data[offset + 2]

      offset += 4
    }

    return tf.tensor3d(buffer, [height, width, 3])
  }
  _classifyImage = async () => {
    try {
      console.log('numTensors (before prediction): ' + tf.memory().numTensors);
      this.setState({ predictions: [] })
      const predictions = await this.modelService.classifyImage(this.state.image);
      this.setState({ predictions: predictions })
      //tf.dispose(predictions);
      console.log('numTensors (after prediction): ' + tf.memory().numTensors);

    } catch (error) {
      console.log('Exception Error: ', error)
    }
  }

}


const styles = StyleSheet.create({
  container: {
      paddingTop: 5,
      flex: 1,
  },

  contentContainer: {
      paddingTop: 10,
      marginTop: 5,
      alignItems: 'center',
      justifyContent: 'center',

  },
  titleContainer: {
      alignItems: 'center',
      marginTop: 10,
      //flex: 2,
      justifyContent: 'center',
  },
  actionsContainer: {
      alignItems: 'center',
      marginTop: 5,
      marginBottom: 5,
      //flex: 1,
  },
  imageContainer: {
      //flex: 4,
      alignItems: 'center',

  },
  callToActionContainer: {
      //flex: 1,
      flexDirection: "row"
  },
  feedBackContainer: {
      //flex: 1,
  },

  feedBackActionsContainer: {
      //flex: 1,
      flexDirection: "row"
  },

  predictionsContainer: {
      //flex: 4,
      padding: 10,
      justifyContent: 'center',

  },

  predictionsContentContainer: {
      //flex: 4,
      padding: 10,

  },

  predictionRow: {
      flexDirection: "row",
      //justifyContent: "space-between"
  },


  predictionRowCategory: {
      //flex: 1,
      justifyContent: "space-between"
  },

  predictionRowLabel: {
      //flex: 1,
      justifyContent: "space-between"

  }
});
