import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LoadState } from '@/components/common/LoadState';
import { Button } from '@/components/ui';
import type { useReviews } from '@/hooks/useReviews';
import { useTheme } from '@/hooks/useTheme';
import { fr } from '@/i18n/fr';
import { fonts, hairline, radius, spacing, touchTarget, typography } from '@/theme';
import type { Review } from '@/types/api';

import { StarRow } from './StarRow';

type Props = { reviews: ReturnType<typeof useReviews>; onWrite: () => void };

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const formatLongDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

/** Avis des lecteurs sur la fiche d'une histoire : moyenne, mon avis ou l'invitation, puis la liste. */
export function ReviewsSection({ reviews, onWrite }: Props) {
  const { colors } = useTheme();
  const { avgRating, count, mine, canReview, loading, error, reload } = reviews;
  const others = reviews.reviews.filter((review) => review.id !== mine?.id);

  if (loading && count === 0 && !mine) return null;

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[typography.overline, { color: colors.textMuted }]}>
        {fr.reviews.title}
      </Text>

      <LoadState loading={false} error={error} onRetry={reload} />

      {avgRating !== null ? (
        <View style={styles.score} accessible accessibilityLabel={fr.reviews.averageLabel(avgRating, count)}>
          <Text style={[styles.scoreNum, { color: colors.text }]}>
            {avgRating.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
            <Text style={[styles.scoreMax, { color: colors.textMuted }]}> / 5</Text>
          </Text>
          <View style={styles.scoreSide}>
            <StarRow rating={avgRating} size={18} />
            <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.reviews.count(count)}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noScore}>
          <Text style={[styles.noScoreTitle, { color: colors.text }]}>{fr.reviews.noneTitle}</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.reviews.noneHint}</Text>
        </View>
      )}

      {mine ? (
        <View style={[styles.mine, { backgroundColor: colors.accentSoft }]}>
          <View style={styles.mineHead}>
            <View style={styles.mineTitle} accessible accessibilityLabel={reviewLabel(mine, fr.reviews.mine)}>
              <Text style={[styles.who, { color: colors.text }]}>{fr.reviews.mine}</Text>
              <StarRow rating={mine.rating} />
            </View>
            {/* Recommencer l'histoire efface la partie terminée : l'avis reste, mais ne se modifie plus. */}
            {canReview ? (
              <Pressable onPress={onWrite} accessibilityRole="button" accessibilityLabel={fr.reviews.editLabel} style={styles.edit}>
                <Text style={[styles.editText, { color: colors.text }]}>{fr.reviews.edit}</Text>
              </Pressable>
            ) : null}
          </View>
          {mine.comment ? (
            <Text style={[styles.comment, { color: colors.text }]} importantForAccessibility="no" accessibilityElementsHidden>
              {mine.comment}
            </Text>
          ) : null}
        </View>
      ) : canReview ? (
        <View style={[styles.invite, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
          <Text style={[styles.inviteText, { color: colors.text }]}>{fr.reviews.invite}</Text>
          <Button label={fr.reviews.write} icon="star" variant="secondary" onPress={onWrite} />
        </View>
      ) : (
        <Text style={[typography.caption, { color: colors.textMuted }]}>{fr.reviews.finishFirst}</Text>
      )}

      {others.length > 0 ? (
        <View>
          {others.map((review) => (
            <View
              key={review.id}
              accessible
              accessibilityLabel={reviewLabel(review, review.author.displayName)}
              style={[styles.review, { borderTopColor: colors.borderStrong }]}
            >
              <View style={styles.reviewHead}>
                <Text style={[styles.who, { color: colors.text }]} numberOfLines={1}>
                  {review.author.displayName}
                </Text>
                <StarRow rating={review.rating} />
                <Text style={[styles.when, { color: colors.textMuted }]}>{formatDate(review.createdAt)}</Text>
              </View>
              {review.comment ? <Text style={[styles.comment, { color: colors.textSoft }]}>{review.comment}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function reviewLabel(review: Review, who: string) {
  const head = `${who}, ${fr.reviews.outOfFive(review.rating)}, ${fr.reviews.on} ${formatLongDate(review.createdAt)}`;
  return review.comment ? `${head} : ${review.comment}` : head;
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  score: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreNum: { fontFamily: fonts.display, fontSize: 52, lineHeight: 56, fontVariant: ['lining-nums'] },
  scoreMax: { fontSize: 22 },
  scoreSide: { gap: 4 },
  noScore: { gap: 4 },
  noScoreTitle: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32 },
  mine: { borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: spacing.sm, gap: 4 },
  mineHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mineTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  edit: { minHeight: touchTarget, minWidth: touchTarget, justifyContent: 'center', alignItems: 'flex-end' },
  editText: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', textDecorationLine: 'underline' },
  invite: { borderWidth: hairline, borderStyle: 'dashed', borderRadius: radius.lg, padding: 14, gap: spacing.md },
  inviteText: { fontFamily: fonts.display, fontSize: 19, lineHeight: 24 },
  review: { borderTopWidth: hairline, paddingVertical: spacing.md, gap: 4 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  who: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20, flexShrink: 1 },
  when: { marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
  comment: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
});
