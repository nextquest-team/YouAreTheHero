import { Children, isValidElement, type ReactNode, useEffect } from 'react';
import { AccessibilityInfo, Platform, Text, type TextProps } from 'react-native';

/**
 * Annonce un message à VoiceOver quand il apparaît ou change. Sur iOS, accessibilityLiveRegion
 * n'a aucun effet (la prop n'existe que sur Android) : il faut passer par AccessibilityInfo.
 */
export function useAnnounce(message: string | null | undefined) {
  useEffect(() => {
    if (Platform.OS === 'ios' && message) AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
}

function plainText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      if (isValidElement<{ children?: ReactNode }>(child)) return plainText(child.props.children);
      return '';
    })
    .join('');
}

/** Texte d'état (erreur, confirmation) annoncé dès qu'il s'affiche, sur iOS comme sur Android. */
export function LiveText({ children, ...rest }: TextProps) {
  useAnnounce(plainText(children));
  return (
    <Text accessibilityLiveRegion="polite" {...rest}>
      {children}
    </Text>
  );
}
