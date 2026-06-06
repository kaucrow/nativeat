import React, { useRef } from 'react';
import { Pressable, TextInput as RNTextInput, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

type OtpInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  autoFocus?: boolean;
  /** Visual size of each cell. "lg" for full screens, "sm" for dialogs. */
  size?: 'lg' | 'sm';
};

/**
 * One hidden input drives N visual cells. Handles digit-only filtering,
 * paste of the full code, and tap-to-focus. Used by the verification screen
 * and the profile email-change flow.
 */
export const OtpInput = ({ value, onChangeText, length = 6, autoFocus, size = 'lg' }: OtpInputProps) => {
  const theme = useTheme();
  const inputRef = useRef<RNTextInput>(null);

  const handleChange = (text: string) => {
    onChangeText(text.replace(/[^0-9]/g, '').slice(0, length));
  };

  const isSmall = size === 'sm';

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: isSmall ? 6 : 8 }}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          const isActive = i === value.length;
          const highlighted = isActive || filled;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                aspectRatio: isSmall ? 0.82 : 0.78,
                borderRadius: isSmall ? 10 : 14,
                borderWidth: highlighted ? 2 : 1,
                borderColor: highlighted ? theme.colors.primary : theme.colors.outlineVariant,
                backgroundColor: theme.colors.elevation.level2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                variant={isSmall ? 'titleLarge' : 'headlineSmall'}
                style={{ color: theme.colors.onSurface, fontWeight: '700' }}
              >
                {value[i] ?? ''}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Hidden input capturing the actual keystrokes */}
      <RNTextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
      />
    </Pressable>
  );
};
