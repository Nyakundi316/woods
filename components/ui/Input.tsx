import { View, Text, TextInput, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, ...props }: Props) {
  return (
    <View className="w-full mb-4">
      {label ? (
        <Text className="text-woods-stone text-xs tracking-widest uppercase mb-2">
          {label}
        </Text>
      ) : null}
      <TextInput
        {...props}
        placeholderTextColor="#8C8680"
        className={`bg-woods-bark text-white px-4 py-4 rounded-sm text-base ${
          error ? 'border border-red-500' : 'border border-transparent'
        }`}
      />
      {error ? (
        <Text className="text-red-400 text-xs mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
