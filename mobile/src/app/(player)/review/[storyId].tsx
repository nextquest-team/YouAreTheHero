import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';

import { RatingPicker } from '@/components/reviews/RatingPicker';
import { Button, Input, Screen } from '@/components/ui';
import { useReviews } from '@/hooks/useReviews';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, spacing, touchTarget, typography } from '@/theme';

const MAX_COMMENT = 1000;

/** Donner (ou modifier) son avis sur une histoire terminée. Écran modal. */
export default function ReviewScreen() {
  const { storyId, title } = useLocalSearchParams<{ storyId: string; title?: string }>();
  const { colors } = useTheme();
  const reviews = useReviews(storyId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const prefilled = useRef(false);

  // Si j'ai déjà donné mon avis, le formulaire part de celui-ci.
  useEffect(() => {
    if (prefilled.current || !reviews.mine) return;
    prefilled.current = true;
    setRating(reviews.mine.rating);
    setComment(reviews.mine.comment ?? '');
  }, [reviews.mine]);

  const publish = async () => {
    if (await reviews.submit(rating, comment)) {
      AccessibilityInfo.announceForAccessibility(fr.reviews.published);
      router.back();
    }
  };

  return (
    <Screen scroll edges={['bottom', 'left', 'right']} contentStyle={styles.content}>
      <View style={[styles.top, { borderBottomColor: colors.borderStrong }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.topLink}>
          <Text style={[styles.topLinkText, { color: colors.text }]}>{fr.common.cancel}</Text>
        </Pressable>
        <Text accessibilityRole="header" style={[styles.topTitle, { color: colors.text }]}>
          {reviews.mine ? fr.reviews.editTitle : fr.reviews.formTitle}
        </Text>
        <View style={styles.topLink} />
      </View>

      <View style={styles.body}>
        <View style={styles.question}>
          {title ? <Text style={[typography.overline, { color: colors.textMuted }]}>{title}</Text> : null}
          <Text style={[styles.questionText, { color: colors.text }]}>{fr.reviews.question}</Text>
        </View>

        <RatingPicker value={rating} onChange={setRating} />

        <View style={styles.field}>
          <Input
            label={fr.reviews.commentLabel}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={MAX_COMMENT}
            style={styles.area}
            textAlignVertical="top"
          />
          <Text style={[styles.count, { color: colors.textMuted }]} accessibilityLabel={fr.reviews.charCount(comment.length, MAX_COMMENT)}>
            {`${comment.length} / ${MAX_COMMENT}`}
          </Text>
        </View>

        {reviews.error ? (
          <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={[typography.label, { color: colors.danger }]}>
            {reviews.error}
          </Text>
        ) : null}

        <Button
          label={fr.reviews.publish}
          onPress={publish}
          loading={reviews.submitting}
          disabled={rating === 0}
          accessibilityHint={rating === 0 ? fr.reviews.pickFirst : undefined}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingTop: 0, gap: 0 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: hairline,
  },
  topLink: { minHeight: touchTarget, minWidth: 88, justifyContent: 'center', paddingHorizontal: spacing.sm },
  topLinkText: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  topTitle: { fontFamily: fonts.display, fontSize: 21, lineHeight: 26 },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, gap: spacing.xl },
  question: { gap: 6 },
  questionText: { fontFamily: fonts.display, fontSize: 25, lineHeight: 29 },
  field: { gap: 4 },
  area: { minHeight: 132 },
  count: { alignSelf: 'flex-end', fontFamily: fonts.mono, fontSize: 11, fontVariant: ['tabular-nums'] },
});
