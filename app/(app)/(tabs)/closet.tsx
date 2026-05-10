import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useClosetItems } from '@/lib/queries/closet';
import { ClosetItemCard } from '@/components/closet/ClosetItemCard';

function EmptyCloset() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-white text-xl font-semibold text-center mb-3">
        Your closet is empty
      </Text>
      <Text className="text-woods-stone text-sm text-center mb-8">
        Photograph items you own and Woods will catalogue them for outfit pairing and drop matching.
      </Text>
    </View>
  );
}

export default function ClosetScreen() {
  const { session } = useAuthStore();
  const { data: items, isLoading, refetch, isRefetching } = useClosetItems(session?.user.id);

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 pt-14 pb-4 flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold tracking-widest">CLOSET</Text>
        <Text className="text-woods-stone text-sm">
          {items?.length ?? 0} item{items?.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 4, paddingBottom: 100 }}
        ListEmptyComponent={<EmptyCloset />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#FFFFFF"
          />
        }
        renderItem={({ item }) => (
          <ClosetItemCard
            item={item}
            onPress={() => {
              Haptics.selectionAsync().catch(() => undefined);
              router.push(`/closet/${item.id}`);
            }}
          />
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
          router.push('/closet/add');
        }}
        className="absolute bottom-8 right-6 bg-white w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-black text-3xl leading-none">+</Text>
      </TouchableOpacity>
    </View>
  );
}
