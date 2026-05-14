import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Core Colors
    primary: '#8E4D2D',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFDBCC',
    onPrimaryContainer: '#713718',
    secondary: '#76574A',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FFDBCC',
    onSecondaryContainer: '#5C4033',
    tertiary: '#665F31',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#EEE4A9',
    onTertiaryContainer: '#4D471B',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#93000A',
    background: '#FFF8F6',
    onBackground: '#221A16',
    surface: '#FFF8F6',
    onSurface: '#221A16',
    surfaceVariant: '#F4DED5',
    onSurfaceVariant: '#52443D',
    outline: '#85736C',
    outlineVariant: '#D7C2BA',

    // Inverse, Shadow & Scrim
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#382E2A',
    inverseOnSurface: '#FFEDE6',
    inversePrimary: '#FFB694',
    surfaceTint: '#8E4D2D',

    // Fixed & Dim Variants
    primaryFixed: '#FFDBCC',
    onPrimaryFixed: '#351000',
    primaryFixedDim: '#FFB694',
    onPrimaryFixedVariant: '#713718',
    secondaryFixed: '#FFDBCC',
    onSecondaryFixed: '#2C160B',
    secondaryFixedDim: '#E6BEAD',
    onSecondaryFixedVariant: '#5C4033',
    tertiaryFixed: '#EEE4A9',
    onTertiaryFixed: '#201C00',
    tertiaryFixedDim: '#D1C88F',
    onTertiaryFixedVariant: '#4D471B',
    surfaceDim: '#E8D6D0',
    surfaceBright: '#FFF8F6',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#FFF1EC',
    surfaceContainer: '#FCEAE3',
    surfaceContainerHigh: '#F6E5DE',
    surfaceContainerHighest: '#F1DFD8',

    // Paper Specific Fallbacks
    surfaceDisabled: 'rgba(34, 26, 22, 0.12)',
    onSurfaceDisabled: 'rgba(34, 26, 22, 0.38)',
    backdrop: 'rgba(52, 44, 38, 0.4)',

    // Paper Elevation Mapping
    elevation: {
      level0: 'transparent',
      level1: '#FFF1EC', // surfaceContainerLow
      level2: '#FCEAE3', // surfaceContainer
      level3: '#F6E5DE', // surfaceContainerHigh
      level4: '#F1DFD8', // surfaceContainerHighest
      level5: '#E8D6D0', // surfaceDim
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Core Colors
    primary: '#FFB694',
    onPrimary: '#542105',
    primaryContainer: '#713718',
    onPrimaryContainer: '#FFDBCC',
    secondary: '#E6BEAD',
    onSecondary: '#442A1F',
    secondaryContainer: '#5C4033',
    onSecondaryContainer: '#FFDBCC',
    tertiary: '#D1C88F',
    onTertiary: '#363107',
    tertiaryContainer: '#4D471B',
    onTertiaryContainer: '#EEE4A9',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    background: '#1A120E',
    onBackground: '#F1DFD8',
    surface: '#1A120E',
    onSurface: '#F1DFD8',
    surfaceVariant: '#52443D',
    onSurfaceVariant: '#D7C2BA',
    outline: '#A08D85',
    outlineVariant: '#52443D',

    // Inverse, Shadow & Scrim
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#F1DFD8',
    inverseOnSurface: '#382E2A',
    inversePrimary: '#8E4D2D',
    surfaceTint: '#FFB694',

    // Fixed & Dim Variants
    primaryFixed: '#FFDBCC',
    onPrimaryFixed: '#351000',
    primaryFixedDim: '#FFB694',
    onPrimaryFixedVariant: '#713718',
    secondaryFixed: '#FFDBCC',
    onSecondaryFixed: '#2C160B',
    secondaryFixedDim: '#E6BEAD',
    onSecondaryFixedVariant: '#5C4033',
    tertiaryFixed: '#EEE4A9',
    onTertiaryFixed: '#201C00',
    tertiaryFixedDim: '#D1C88F',
    onTertiaryFixedVariant: '#4D471B',
    surfaceDim: '#1A120E',
    surfaceBright: '#423732',
    surfaceContainerLowest: '#140C09',
    surfaceContainerLow: '#221A16',
    surfaceContainer: '#271E1A',
    surfaceContainerHigh: '#322824',
    surfaceContainerHighest: '#3D332E',

    // Paper Specific Fallbacks
    surfaceDisabled: 'rgba(241, 223, 216, 0.12)', 
    onSurfaceDisabled: 'rgba(241, 223, 216, 0.38)',
    backdrop: 'rgba(34, 26, 22, 0.4)',

    elevation: {
      level0: 'transparent',
      level1: '#221A16', // surfaceContainerLow
      level2: '#271E1A', // surfaceContainer
      level3: '#322824', // surfaceContainerHigh
      level4: '#3D332E', // surfaceContainerHighest
      level5: '#423732', // surfaceBright
    },
  },
};