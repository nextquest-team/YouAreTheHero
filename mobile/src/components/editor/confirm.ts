import { Alert } from 'react-native';

import type { RemoveResult } from '@/hooks/useEntityEditor';
import { fr } from '@/i18n/fr';

type Texts = { deleteTitle: string; inUseTitle: string; inUseIntro: string };

/**
 * Demande confirmation avant de supprimer un élément de l'histoire. S'il est encore cité
 * (409 *_IN_USE), une seconde alerte liste les endroits à corriger d'abord.
 */
export function confirmRemove(texts: Texts, name: string, remove: () => Promise<RemoveResult>, onRemoved: () => void) {
  Alert.alert(texts.deleteTitle, name, [
    { text: fr.common.cancel, style: 'cancel' },
    {
      text: fr.common.delete,
      style: 'destructive',
      onPress: async () => {
        const result = await remove();
        if (result.ok) onRemoved();
        else if (result.usedIn.length > 0) {
          const lines = result.usedIn.map((usage) => `• ${fr.usageKinds[usage.kind]} : ${usage.label}`).join('\n');
          Alert.alert(texts.inUseTitle, `${texts.inUseIntro}\n\n${lines}`);
        }
      },
    },
  ]);
}
