import { useRef, useState, useCallback } from 'react';
import {
  View, Text, Image, FlatList, Alert, TouchableOpacity,
  KeyboardAvoidingView, ScrollView, Platform, Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { ItemForm, type ItemFormState } from '@/components/closet/ItemForm';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useClosetItems, useUpdateClosetItem, useDeleteClosetItem } from '@/lib/queries/closet';
import type { ClosetItem } from '@/types/closet';
import { CATEGORY_LABELS } from '@/types/closet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function DetailPage({
  item,
  isEditing,
  formState,
  onFormChange,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  isSaving,
}: {
  item: ClosetItem;
  isEditing: boolean;
  formState: ItemFormState;
  onFormChange: (patch: Partial<ItemFormState>) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  isSaving: boolean;
}) {
  return (
    <View style={{ width: SCREEN_WIDTH }} className="flex-1 bg-black">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Photo */}
          <Image
            source={{ uri: item.photo_url }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
            resizeMode="cover"
          />

          <View className="px-6 pt-6 pb-10">
            {isEditing ? (
              <>
                <Text className="text-woods-stone text-xs mb-4">Edit item details</Text>
                <ItemForm value={formState} onChange={onFormChange} />
                <View className="gap-3">
                  <Button label="Save Changes" loading={isSaving} onPress={onSave} />
                  <Button label="Cancel" variant="secondary" onPress={onCancelEdit} />
                </View>
              </>
            ) : (
              <>
                <View className="flex-row items-start justify-between mb-1">
                  <View className="flex-1 mr-4">
                    <Text className="text-white text-2xl font-bold leading-tight">
                      {item.brand}
                    </Text>
                    <Text className="text-white text-xl">{item.model}</Text>
                  </View>
                  <View className="border border-woods-stone px-2 py-1 rounded-sm">
                    <Text className="text-woods-stone text-xs">
                      {CATEGORY_LABELS[item.category]}
                    </Text>
                  </View>
                </View>

                {item.colorway ? (
                  <Text className="text-woods-stone text-sm mb-4">{item.colorway}</Text>
                ) : null}

                {item.acquired_at ? (
                  <Text className="text-woods-bark text-xs mb-4">
                    Acquired {new Date(item.acquired_at).toLocaleDateString()}
                  </Text>
                ) : null}

                <Text className="text-woods-bark text-xs mb-6">
                  Added {new Date(item.created_at).toLocaleDateString()}
                </Text>

                <View className="gap-3">
                  <Button label="Edit" variant="secondary" onPress={onEdit} />
                  <Button label="Delete" variant="ghost" onPress={onDelete} />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function ClosetItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthStore();
  const { data: items, isLoading } = useClosetItems(session?.user.id);
  const updateItem = useUpdateClosetItem();
  const deleteItem = useDeleteClosetItem();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ItemFormState>({ brand: '', model: '', colorway: '', category: 'sneaker' });
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ClosetItem>>(null);

  const initialIndex = items?.findIndex((item) => item.id === id) ?? 0;

  const startEdit = useCallback((item: ClosetItem) => {
    setFormState({
      brand: item.brand,
      model: item.model,
      colorway: item.colorway ?? '',
      category: item.category,
    });
    setEditingId(item.id);
  }, []);

  const cancelEdit = useCallback(() => setEditingId(null), []);

  const handleSave = useCallback(async (item: ClosetItem) => {
    try {
      await updateItem.mutateAsync({ id: item.id, patch: { ...formState } });
      setEditingId(null);
    } catch (e: unknown) {
      setError((e as { message?: string }).message ?? 'Could not update item');
    }
  }, [formState, updateItem]);

  const handleDelete = useCallback((item: ClosetItem) => {
    Alert.alert(
      'Delete item',
      `Remove ${item.brand} ${item.model} from your closet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem.mutateAsync({ id: item.id, userId: item.user_id });
              router.back();
            } catch (e: unknown) {
              setError((e as { message?: string }).message ?? 'Could not delete item');
            }
          },
        },
      ],
    );
  }, [deleteItem]);

  if (isLoading || !items) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Back button */}
      <View className="absolute top-14 left-4 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-black/60 px-4 py-2 rounded-full"
        >
          <Text className="text-white text-sm">← Closet</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal swipeable list */}
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex >= 0 ? initialIndex : 0}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <DetailPage
            item={item}
            isEditing={editingId === item.id}
            formState={formState}
            onFormChange={(patch) => setFormState((prev) => ({ ...prev, ...patch }))}
            onEdit={() => startEdit(item)}
            onCancelEdit={cancelEdit}
            onSave={() => handleSave(item)}
            onDelete={() => handleDelete(item)}
            isSaving={updateItem.isPending}
          />
        )}
      />

      <ErrorToast message={error} onDismiss={() => setError(null)} />
    </View>
  );
}
