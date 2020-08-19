import * as React from 'react';

//import { Text, View } from '../components/Themed';

import * as Permissions from 'expo-permissions'
import * as tf from '@tensorflow/tfjs';
import { fetch ,asyncStorageIO,bundleResourceIO,decodeJpeg} from '@tensorflow/tfjs-react-native'
import * as jpeg from 'jpeg-js'
import * as FileSystem from 'expo-file-system'


import {
  Image,
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,

} from 'react-native';
import {AppConfig} from "../config"


import {Text, Icon, ListItem} from 'react-native-elements';


import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';




export default class HomeScreen extends React.Component {
  static navigationOptions = {
    header: null,
  };

  state = {
      image: {},
      loading: false,
      isTfReady: false,
      isModelReady: false,
      predictions: [],
      model:null
  }

  model:any =null;
  model_classes:any = [];

  async componentDidMount() {
    await tf.ready(); // preparing TensorFlow
    this.setState({ isTfReady: true,});


    const modelJSON = require('../assets/model/model.json');
    const modelWeights = require('../assets/model/group1-shard1of1.bin');
    this.model = await tf.loadLayersModel(bundleResourceIO(modelJSON, modelWeights));
    this.model_classes = require("../assets/model/classes.json")
    this.model.summary();

    console.log("Done loading custom model");

    //this.model = await mobilenet.load(); // preparing MobileNet model


    this.setState({ isModelReady: true  });

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
      if (this.state.predictions.length > 0) {
          return (
              <View style={styles.predictionsContentContainer}>
                  <Text h3>Predictions</Text>
                  <View>
                      {
                          predictions.map((item, index) => (
                              <ListItem
                                  key={index}
                                  title={item.className}
                                  subtitle={`prob: ${item.probability}`} hideChevron={true}
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

  _classifyImage = async () => {
    try {
      this.setState({ predictions: [] })
      console.log(`Classifying Image: Start `)
      

      console.log(`Fetching Image: Start `)
      const imgB64 = await FileSystem.readAsStringAsync(this.state.image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
      const raw = new Uint8Array(imgBuffer)  
      const imageTensor = decodeJpeg(raw);
      console.log(`Fetching Image: Done `)

      // const imageAssetPath = Image.resolveAssetSource(this.state.image)
      // const response = await fetch(imageAssetPath.uri, {}, { isBinary: true })
      // const rawImageData = await response.arrayBuffer()
      // const imageTensor = this.imageToTensor(rawImageData)
      // const predictions = await this.model.classify(imageTensor);

      const IMAGE_SIZE = 224;

      console.log("Preprocessing image: Start")
      const preProcessedImage = imageTensor;
      // const preProcessedImage = tf.tidy(() => {
      //   const b = tf.scalar(127.5);

      //   let res = tf.div(imageTensor,b);
        
      //   res = tf.sub( res, 1) ;

      //   // https://github.com/keras-team/keras-applications/blob/master/keras_applications/imagenet_utils.py#L43



      //   let normalized = res;            
      //   const alignCorners = true;
      //   // Note it would probably be better to center crop 
      //   // the image than to resize
      //   const resized =
      //     normalized.resizeBilinear([IMAGE_SIZE, IMAGE_SIZE], alignCorners)
      //   const batchedImage = resized.expandDims();
      //   return batchedImage;
      // })          

      console.log("Preprocessing image: Done")

      console.log("Prediction: Start")
      const predictions = await this.model.predict(preProcessedImage);
      console.log(predictions);
      console.log("Prediction: Done")


      console.log("Post Processing: Start")

      // post processing
      const mobilenetClasses = tf.tidy(() => {
        const topK = 3;
        

        const {values, indices} = predictions.topk(topK);
        const topKValues = values.dataSync();
        const topKIndices = indices.dataSync();

        const topClassesAndProbs = [];
        for (let i = 0; i < topKIndices.length; i++) {
          const indStr  = String(i)
          topClassesAndProbs.push({
            className: this.model_classes[topKIndices[i]],
            probability: topKValues[i]
          });
        }
        return topClassesAndProbs;
      })

      tf.dispose[predictions, preProcessedImage];
      console.log("Post Processing: Done")



      this.setState({ predictions: mobilenetClasses })
      console.log(mobilenetClasses)

      console.log(`Classifying Image: End `)
    } catch (error) {
      console.log('Exception Error: ', error)
    }
  }

}


const styles1 = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});


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
