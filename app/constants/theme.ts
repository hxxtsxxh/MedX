import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Define your custom colors
const customColors = {
  primary: '#0D2F5D',    // Dark blue
  secondary: '#78A8D9',  // Medium blue
  tertiary: '#CADEED',   // Light blue
  darkBlue: '#092442',   // Darker version of primary
  lightBlue: '#E5F0F7',  // Lighter version of tertiary
  background: '#F8FBFD',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    // Override all MD3 colors with our blue palette
    primary: customColors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: customColors.secondary,
    onPrimaryContainer: customColors.primary,
    secondary: customColors.secondary,
    onSecondary: customColors.primary,
    secondaryContainer: customColors.tertiary,
    onSecondaryContainer: customColors.primary,
    tertiary: customColors.tertiary,
    onTertiary: customColors.primary,
    tertiaryContainer: customColors.lightBlue,
    onTertiaryContainer: customColors.primary,
    background: customColors.background,
    onBackground: customColors.primary,
    surface: customColors.lightBlue,
    onSurface: customColors.primary,
    surfaceVariant: customColors.tertiary,
    onSurfaceVariant: customColors.secondary,
    surfaceDisabled: customColors.tertiary,
    onSurfaceDisabled: customColors.secondary,
    outline: customColors.secondary,
    outlineVariant: customColors.tertiary,
    shadow: customColors.darkBlue,
    scrim: customColors.darkBlue,
    inverseSurface: customColors.primary,
    inverseOnSurface: customColors.tertiary,
    inversePrimary: customColors.tertiary,
    error: customColors.darkBlue,
    onError: customColors.tertiary,
    errorContainer: customColors.primary,
    onErrorContainer: customColors.tertiary,
    elevation: {
      level0: 0,
      level1: 1,
      level2: 2,
      level3: 3,
      level4: 4,
      level5: 5,
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    // Override all MD3 colors with our blue palette
    primary: customColors.tertiary,
    onPrimary: customColors.primary,
    primaryContainer: customColors.secondary,
    onPrimaryContainer: customColors.tertiary,
    secondary: customColors.secondary,
    onSecondary: customColors.tertiary,
    secondaryContainer: customColors.primary,
    onSecondaryContainer: customColors.tertiary,
    tertiary: customColors.primary,
    onTertiary: customColors.tertiary,
    tertiaryContainer: customColors.darkBlue,
    onTertiaryContainer: customColors.tertiary,
    background: customColors.darkBlue,
    onBackground: customColors.tertiary,
    surface: customColors.primary,
    onSurface: customColors.tertiary,
    surfaceVariant: customColors.secondary,
    onSurfaceVariant: customColors.tertiary,
    surfaceDisabled: customColors.darkBlue,
    onSurfaceDisabled: customColors.secondary,
    outline: customColors.secondary,
    outlineVariant: customColors.tertiary,
    shadow: customColors.darkBlue,
    scrim: customColors.darkBlue,
    inverseSurface: customColors.tertiary,
    inverseOnSurface: customColors.primary,
    inversePrimary: customColors.primary,
    error: customColors.tertiary,
    onError: customColors.primary,
    errorContainer: customColors.secondary,
    onErrorContainer: customColors.primary,
    elevation: {
      level0: 0,
      level1: 1,
      level2: 2,
      level3: 3,
      level4: 4,
      level5: 5,
    },
  },
};

export default { lightTheme, darkTheme };
