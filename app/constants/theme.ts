import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Define your custom colors
const customColors = {
  light: {
    primary: '#0D47A1',      // Deep Blue
    secondary: '#1976D2',    // Medium Blue
    tertiary: '#42A5F5',     // Light Blue
    surface: '#FFFFFF',
    background: '#F5F9FF',   // Very Light Blue tint
    surfaceVariant: '#EEF2F6',
    error: '#D32F2F',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#1C1B1F',
    onBackground: '#1C1B1F',
    onSurfaceVariant: '#44474F',
    outline: '#74777F',
    elevation: {
      level0: 'transparent',
      level1: '#F6F8FB',
      level2: '#F1F4F9',
      level3: '#ECF0F6',
      level4: '#E7EDF4',
      level5: '#E2E9F1',
    },
  },
  dark: {
    primary: '#90CAF9',      // Light Blue
    secondary: '#64B5F6',    // Medium Light Blue
    tertiary: '#42A5F5',     // Medium Blue
    surface: '#1A1C1E',
    background: '#111315',   // Very Dark Blue-grey
    surfaceVariant: '#252729',
    error: '#EF5350',
    onPrimary: '#003064',
    onSecondary: '#003064',
    onTertiary: '#003064',
    onSurface: '#E3E2E6',
    onBackground: '#E3E2E6',
    onSurfaceVariant: '#C4C6D0',
    outline: '#8E9099',
    elevation: {
      level0: 'transparent',
      level1: '#1E2022',
      level2: '#232527',
      level3: '#282A2C',
      level4: '#2D2F31',
      level5: '#323436',
    },
  }
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...customColors.light,
    primaryContainer: customColors.light.surfaceVariant,
    secondaryContainer: customColors.light.surfaceVariant,
    tertiaryContainer: customColors.light.surfaceVariant,
    onPrimaryContainer: customColors.light.primary,
    onSecondaryContainer: customColors.light.secondary,
    onTertiaryContainer: customColors.light.tertiary,
  },
  roundness: 2,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...customColors.dark,
    primaryContainer: customColors.dark.surfaceVariant,
    secondaryContainer: customColors.dark.surfaceVariant,
    tertiaryContainer: customColors.dark.surfaceVariant,
    onPrimaryContainer: customColors.dark.primary,
    onSecondaryContainer: customColors.dark.secondary,
    onTertiaryContainer: customColors.dark.tertiary,
  },
  roundness: 2,
};

// Fix the type error in _layout.tsx by adding string type to elevation values
export const fixedLightTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    elevation: {
      level0: '0px',
      level1: '1px',
      level2: '2px',
      level3: '3px',
      level4: '4px',
      level5: '5px',
    },
  },
};

export const fixedDarkTheme = {
  ...darkTheme,
  colors: {
    ...darkTheme.colors,
    elevation: {
      level0: '0px',
      level1: '1px',
      level2: '2px',
      level3: '3px',
      level4: '4px',
      level5: '5px',
    },
  },
};

export default { lightTheme, darkTheme };
