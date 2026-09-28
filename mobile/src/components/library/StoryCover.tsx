import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { assetUrl } from '@/services/client';
import { radius } from '@/theme';

type Props = { uri: string | null; width: number; height: number };

/** Couverture d'une histoire, ou un emplacement avec un livre quand il n'y en a pas. */
export function StoryCover({ uri, width, height }: Props) {
  const { colors } = useTheme();
  const source = assetUrl(uri);
  const frame = [styles.frame, { width, height, backgroundColor: colors.surfaceAlt }];

  if (!source) {
    return (
      <View style={frame}>
        <Feather name="book" size={Math.round(width / 3)} color={colors.textMuted} />
      </View>
    );
  }

  return <Image source={source} style={frame} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />;
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
