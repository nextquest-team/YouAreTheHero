import type {
  Choice,
  ChoiceInput,
  CreateStoryInput,
  CreatorStory,
  CreatorStoryFull,
  Enemy,
  EnemyInput,
  Item,
  ItemInput,
  PublishResult,
  Scene,
  SceneInput,
  StatDefinition,
  StatInput,
  UpdateStoryInput,
} from '@/types/api';

import { apiFetch } from './client';

export function listMyStories(): Promise<CreatorStory[]> {
  return apiFetch<CreatorStory[]>('/me/stories');
}

export function createStory(input: CreateStoryInput): Promise<CreatorStory> {
  return apiFetch<CreatorStory>('/me/stories', { method: 'POST', body: input });
}

export function getMyStory(id: string): Promise<CreatorStoryFull> {
  return apiFetch<CreatorStoryFull>(`/me/stories/${id}`);
}

/** 409 STORY_PUBLISHED si l'histoire est publiée, 422 HAS_COMBAT_SCENES si on retire les combats trop tôt. */
export function updateStory(id: string, input: UpdateStoryInput): Promise<CreatorStory> {
  return apiFetch<CreatorStory>(`/me/stories/${id}`, { method: 'PATCH', body: input });
}

export function deleteStory(id: string): Promise<void> {
  return apiFetch<void>(`/me/stories/${id}`, { method: 'DELETE' });
}

/** 422 STORY_INVALID avec le détail `errors` et `warnings` si une règle de publication n'est pas respectée. */
export function publishStory(id: string): Promise<PublishResult> {
  return apiFetch<PublishResult>(`/me/stories/${id}/publish`, { method: 'POST' });
}

export function unpublishStory(id: string): Promise<CreatorStory> {
  return apiFetch<CreatorStory>(`/me/stories/${id}/unpublish`, { method: 'POST' });
}

/** 422 INVALID_STAT (détail `field`) si le type, la valeur par défaut, le min et le max ne vont pas ensemble. */
export function createStat(storyId: string, input: StatInput): Promise<StatDefinition> {
  return apiFetch<StatDefinition>(`/me/stories/${storyId}/stats`, { method: 'POST', body: input });
}

export function updateStat(statId: string, input: Partial<StatInput>): Promise<StatDefinition> {
  return apiFetch<StatDefinition>(`/me/stats/${statId}`, { method: 'PATCH', body: input });
}

/** 409 STAT_IN_USE (détail `usedIn`) si une condition ou un effet cite encore la stat. */
export function deleteStat(statId: string): Promise<void> {
  return apiFetch<void>(`/me/stats/${statId}`, { method: 'DELETE' });
}

// Objets, ennemis, scènes et choix : 422 INVALID_REFERENCE (détail `field`) si un id cité
// n'appartient pas à l'histoire, 409 *_IN_USE (détail `usedIn`) à la suppression d'un élément encore cité.

export function createItem(storyId: string, input: ItemInput): Promise<Item> {
  return apiFetch<Item>(`/me/stories/${storyId}/items`, { method: 'POST', body: input });
}

export function updateItem(itemId: string, input: Partial<ItemInput>): Promise<Item> {
  return apiFetch<Item>(`/me/items/${itemId}`, { method: 'PATCH', body: input });
}

export function deleteItem(itemId: string): Promise<void> {
  return apiFetch<void>(`/me/items/${itemId}`, { method: 'DELETE' });
}

export function createEnemy(storyId: string, input: EnemyInput): Promise<Enemy> {
  return apiFetch<Enemy>(`/me/stories/${storyId}/enemies`, { method: 'POST', body: input });
}

export function updateEnemy(enemyId: string, input: Partial<EnemyInput>): Promise<Enemy> {
  return apiFetch<Enemy>(`/me/enemies/${enemyId}`, { method: 'PATCH', body: input });
}

export function deleteEnemy(enemyId: string): Promise<void> {
  return apiFetch<void>(`/me/enemies/${enemyId}`, { method: 'DELETE' });
}

/** 422 COMBAT_DISABLED si l'histoire est sans combats, SCENE_HAS_CHOICES si on ajoute un ennemi à une scène à choix. */
export function createScene(storyId: string, input: SceneInput): Promise<Scene> {
  return apiFetch<Scene>(`/me/stories/${storyId}/scenes`, { method: 'POST', body: input });
}

export function updateScene(sceneId: string, input: Partial<SceneInput>): Promise<Scene> {
  return apiFetch<Scene>(`/me/scenes/${sceneId}`, { method: 'PATCH', body: input });
}

export function deleteScene(sceneId: string): Promise<void> {
  return apiFetch<void>(`/me/scenes/${sceneId}`, { method: 'DELETE' });
}

/** 422 COMBAT_SCENE si la scène a un ennemi : une scène de combat n'a pas de choix. */
export function createChoice(sceneId: string, input: ChoiceInput): Promise<Choice> {
  return apiFetch<Choice>(`/me/scenes/${sceneId}/choices`, { method: 'POST', body: input });
}

export function updateChoice(choiceId: string, input: Partial<ChoiceInput>): Promise<Choice> {
  return apiFetch<Choice>(`/me/choices/${choiceId}`, { method: 'PATCH', body: input });
}

export function deleteChoice(choiceId: string): Promise<void> {
  return apiFetch<void>(`/me/choices/${choiceId}`, { method: 'DELETE' });
}
