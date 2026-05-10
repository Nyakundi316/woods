import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = TouchableOpacityProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

const styles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-white py-4 rounded-sm items-center justify-center',
    text: 'text-black font-semibold text-base tracking-wide',
  },
  secondary: {
    container: 'border border-woods-stone py-4 rounded-sm items-center justify-center',
    text: 'text-white font-semibold text-base tracking-wide',
  },
  ghost: {
    container: 'py-4 items-center justify-center',
    text: 'text-woods-stone text-sm tracking-wide',
  },
};

export function Button({ label, variant = 'primary', loading = false, disabled, className = '', ...props }: Props) {
  const s = styles[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      {...props}
      disabled={isDisabled}
      className={`${s.container} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? '#000' : '#fff'} />
        : <Text className={s.text}>{label}</Text>
      }
    </TouchableOpacity>
  );
}
