import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export const SectionHeader = ({ title, subtitle }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <Text variant="titleLarge" style={styles.sectionTitle}>
      {title}
    </Text>
    {subtitle ? (
      <Text variant="bodyMedium" style={styles.sectionSubtitle}>
        {subtitle}
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionSubtitle: {
    opacity: 0.75,
  },
});