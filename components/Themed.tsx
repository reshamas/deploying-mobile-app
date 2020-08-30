import * as React from 'react';
import { View as DefaultView ,ScrollView as DefaultScrollView, ActivityIndicator as DefaultActivityIndicator } from 'react-native';
import {Text as DefaultText, ListItem as DefaultListItem } from 'react-native-elements';

import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function ScrollView(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultScrollView style={[{ backgroundColor }, style]} {...otherProps} />;
}


export function getColor(property:keyof typeof Colors.light & keyof typeof Colors.dark){

  //const backgroundColor = useThemeColor({ light: Colors.lightColor, dark: darkColor }, property);
  const theme = useColorScheme();

  
  const color =  Colors[theme][property];
  return color as string;
}

export function ActivityIndicator(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultActivityIndicator size="large" color={textColor}/>
}


export function ListItem(props: any) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');


  return <DefaultListItem containerStyle={[{ backgroundColor,color }, style]} style={[{ backgroundColor,color }, style]} {...otherProps} />;
}
