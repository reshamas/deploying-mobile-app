import * as React from 'react';

//import { Text, View } from '../components/Themed';

import * as Permissions from 'expo-permissions'
import * as tf from '@tensorflow/tfjs';
import * as ImageManipulator from 'expo-image-manipulator';


import {
  Image,
  StyleSheet,
} from 'react-native';
import {AppConfig} from "../config"

import {Text ,View,getColor,ActivityIndicator,ScrollView} from '../components/Themed'

import {Icon, ListItem} from 'react-native-elements';


import * as ImagePicker from 'expo-image-picker';
import { ModelService, IModelPredictionResponse,IModelPredictionTiming,ModelPrediction } from '../components/ModelService';


type State = {
  image: ImageManipulator.ImageResult; 
  loading:boolean;
  isTfReady: boolean;
  isModelReady: boolean;
  predictions: ModelPrediction[]|null;
  error:string|null;
  timing:IModelPredictionTiming|null;
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
      predictions: null,
      error:null,
      timing:null
  }

  modelService!:ModelService;

  async componentDidMount() {
    this.setState({ loading: true });
    this.modelService = await ModelService.create();
    this.setState({ isTfReady: true,isModelReady: true,loading: false  });
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
          return <ActivityIndicator/>
      }
      let predictions= this.state.predictions || [];
   
      if (predictions.length > 0) {
          return (
              <View style={styles.predictionsContentContainer}>
                  <Text h3>Predictions</Text>
                  <View>
                      {
                          predictions.map((item, index) => (
                              <ListItem key={index} >
                                <ListItem.Content >

                                  <ListItem.Title>{item.className}</ListItem.Title>
                                  <ListItem.Subtitle>{`prob: ${item.probability.toFixed(3)}`}</ListItem.Subtitle>
                                </ListItem.Content>

                              </ListItem>
                          ))
                      }
                  </View>


                  <Text h3>Timing (ms)</Text>
                  <View>
                    <Text>total time: {this.state.timing?.totalTime}</Text>
                    <Text>loading time: {this.state.timing?.imageLoadingTime}</Text>
                    <Text>preprocessing time: {this.state.timing?.imagePreprocessing}</Text>
                    <Text>prediction time: {this.state.timing?.imagePrediction}</Text>

                   
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
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3]
        })

        if (!response.cancelled) {
          //const source = { uri: response.uri }

          //this.setState({ image: source })
          this._classifyImage(response.uri)
        }
      } catch (error) {
        console.log(error)
      }

  };

  _pickImageFromCamera = async () => {
      const status = await this._verifyPermissions();

      try {

        let response = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3]
        });

        if (!response.cancelled) {
          //const source = { uri: response.uri }
          
          this._classifyImage(response.uri)
        }
    }  catch (error) {
      console.log(error)
    }

  };

  _classifyImage = async (imageUri:string) => {
    try {
      const res:ImageManipulator.ImageResult = await ImageManipulator.manipulateAsync(imageUri,
        [{ resize: { width:224, height:224 }}],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG,base64:true }
        );
      
      this.setState({ image: res})
      console.log('numTensors (before prediction): ' + tf.memory().numTensors);
      this.setState({ predictions: [] ,error:null , loading:true })

      const predictionResponse = await this.modelService.classifyImage(res);
      
      
      if (predictionResponse.error){
        this.setState({ error: predictionResponse.error , loading:false})
      }else{
        const predictions = predictionResponse.predictions  || null;
        this.setState({ predictions: predictions, timing:predictionResponse.timing,  loading:false})
      }
      
      
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
      alignItems: 'center',
  },
  callToActionContainer: {
      flexDirection: "row"
  },

  feedBackActionsContainer: {
      flexDirection: "row"
  },

  predictionsContainer: {
      padding: 10,
      justifyContent: 'center',
  },

  predictionsContentContainer: {
      padding: 10,
  },
  predictionRow: {
      flexDirection: "row",
  },
  predictionRowCategory: {
      justifyContent: "space-between"
  },
  predictionRowLabel: {
      justifyContent: "space-between"
  }
});
