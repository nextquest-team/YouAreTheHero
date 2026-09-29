import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { fr } from '@/i18n/fr';
import { fonts } from '@/theme';

// Un seul rendu, quel que soit le thème : il prend le relais du splash natif,
// dont le fond (app.json, expo-splash-screen) est ce même papier.
const paper = '#F3EBDB';
const surface = '#FBF6EC';
const ink = '#1D1A16';
const inkSoft = '#574E44'; // 6,9:1 sur le papier
const red = '#B3321F'; // 5,2:1 sur le papier

// Faces des dés, case par case (3 x 3) : 6 à l'encre, 5 en vermillon, « Tu fais 11 »
const SIX = [1, 0, 1, 1, 0, 1, 1, 0, 1];
const FIVE = [1, 0, 1, 0, 1, 0, 1, 0, 1];

// Chute avec un léger dépassement : le dé rebondit en touchant la table
const land = Easing.bezier(0.25, 1.25, 0.5, 1);
const IMPACT = 1250; // le tampon s'abat
const HOLD_UNTIL = 2900;
const FADE = 350;

type Props = { onDone: () => void };

/**
 * Splash animé « le dé du destin » : deux dés tombent en roulant, le titre s'abat comme
 * un tampon et l'écran tremble à l'impact. Avec « Réduire les animations », on montre
 * directement l'image finale. Un toucher passe l'animation.
 */
export function AnimatedSplash({ onDone }: Props) {
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const from = reduceMotion ? 0 : 1; // 1 = début de l'animation, 0 = image finale

  const die1 = useSharedValue(from);
  const die2 = useSharedValue(from);
  const stamp = useSharedValue(from);
  const shake = useSharedValue(0);
  const roll = useSharedValue(from);
  const tagline = useSharedValue(from);
  const overlay = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      overlay.set(withDelay(900, withTiming(0, { duration: FADE }, (done) => done && scheduleOnRN(onDone))));
      return;
    }

    die1.set(withDelay(200, withTiming(0, { duration: 1000, easing: land })));
    die2.set(withDelay(350, withTiming(0, { duration: 1000, easing: land })));
    stamp.set(withDelay(IMPACT, withTiming(0, { duration: 450, easing: Easing.bezier(0.2, 0.8, 0.3, 1.2) })));
    // Tremblement de 2 px à l'impact du tampon
    shake.set(
      withDelay(
        IMPACT + 100,
        withSequence(
          withTiming(2, { duration: 70 }),
          withTiming(-2, { duration: 70 }),
          withTiming(1, { duration: 70 }),
          withTiming(0, { duration: 70 }),
        ),
      ),
    );
    roll.set(withDelay(1800, withTiming(0, { duration: 500 })));
    tagline.set(withDelay(2050, withTiming(0, { duration: 500 })));
    overlay.set(withDelay(HOLD_UNTIL, withTiming(0, { duration: FADE }, (done) => done && scheduleOnRN(onDone))));
  }, [reduceMotion, onDone, die1, die2, stamp, shake, roll, tagline, overlay]);

  const skip = () => {
    overlay.set(withTiming(0, { duration: 200 }, (done) => done && scheduleOnRN(onDone)));
  };

  const fall = height / 2 + 120;
  const die1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -40 * die1.get() },
      { translateY: -fall * die1.get() },
      { rotate: `${-560 * die1.get()}deg` },
    ],
  }));
  const die2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: 50 * die2.get() },
      { translateY: -(fall + 20) * die2.get() },
      { rotate: `${620 * die2.get()}deg` },
    ],
  }));
  const stampStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, (1 - stamp.get()) / 0.7),
    transform: [{ scale: 1 + 1.8 * stamp.get() }, { rotate: `${-3 - 7 * stamp.get()}deg` }],
  }));
  const rollStyle = useAnimatedStyle(() => ({ opacity: 1 - roll.get(), transform: [{ translateY: 8 * roll.get() }] }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: 1 - tagline.get(),
    transform: [{ translateY: 8 * tagline.get() }],
  }));
  const sceneStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }, { translateY: shake.get() / 2 }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.get() }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, overlayStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={skip}>
        <Animated.View style={[styles.scene, sceneStyle]}>
          <View style={styles.dice}>
            <Animated.View style={die1Style}>
              <Die pips={SIX} color={ink} />
            </Animated.View>
            <Animated.View style={die2Style}>
              <Die pips={FIVE} color={red} />
            </Animated.View>
          </View>
          <Animated.View style={[styles.stamp, stampStyle]}>
            <Text style={styles.stampText}>{fr.splash.stampTop}</Text>
            <Text style={styles.stampText}>{fr.splash.stampBottom}</Text>
          </Animated.View>
          <Animated.Text style={[styles.roll, rollStyle]}>{fr.splash.roll}</Animated.Text>
          <Animated.Text style={[styles.tagline, taglineStyle]}>{fr.library.tagline}</Animated.Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function Die({ pips, color }: { pips: number[]; color: string }) {
  return (
    <View style={styles.die}>
      {pips.map((on, index) => (
        <View key={index} style={styles.cell}>
          {on ? <View style={[styles.pip, { backgroundColor: color }]} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: paper, zIndex: 10 },
  scene: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingHorizontal: 32 },
  dice: { flexDirection: 'row', gap: 18 },
  die: {
    width: 68,
    height: 68,
    padding: 7,
    borderWidth: 2,
    borderColor: ink,
    borderRadius: 9,
    backgroundColor: surface,
    boxShadow: `3px 3px 0px ${ink}`,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: { width: '33.33%', height: '33.33%', alignItems: 'center', justifyContent: 'center' },
  pip: { width: 11, height: 11, borderRadius: 6 },
  stamp: { borderWidth: 3, borderColor: red, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  stampText: { fontFamily: fonts.monoBold, fontSize: 18, lineHeight: 23, letterSpacing: 2.2, color: red, textTransform: 'uppercase' },
  roll: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.5, color: inkSoft, textTransform: 'uppercase' },
  tagline: { fontFamily: fonts.bodyItalic, fontSize: 16, lineHeight: 22, color: inkSoft, textAlign: 'center' },
});
