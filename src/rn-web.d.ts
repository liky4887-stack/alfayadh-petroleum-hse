declare module 'react-native' {
  import type { ComponentType, ReactNode } from 'react';

  type RNStyle = {
    flex?: number;
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: number | string;
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    alignSelf?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    padding?: number | string;
    paddingHorizontal?: number | string;
    paddingVertical?: number | string;
    paddingTop?: number | string;
    paddingBottom?: number | string;
    paddingLeft?: number | string;
    paddingRight?: number | string;
    paddingStart?: number | string;
    paddingEnd?: number | string;
    margin?: number | string;
    marginHorizontal?: number | string;
    marginVertical?: number | string;
    marginTop?: number | string;
    marginBottom?: number | string;
    marginLeft?: number | string;
    marginRight?: number | string;
    marginStart?: number | string;
    marginEnd?: number | string;
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    maxWidth?: number | string;
    minHeight?: number | string;
    maxHeight?: number | string;
    position?: 'absolute' | 'relative' | 'static' | 'fixed' | 'sticky';
    top?: number | string;
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
    start?: number | string;
    end?: number | string;
    borderWidth?: number | string;
    borderTopWidth?: number | string;
    borderBottomWidth?: number | string;
    borderLeftWidth?: number | string;
    borderRightWidth?: number | string;
    borderColor?: string;
    borderTopColor?: string;
    borderBottomColor?: string;
    borderLeftColor?: string;
    borderRightColor?: string;
    borderRadius?: number | string;
    borderTopLeftRadius?: number | string;
    borderTopRightRadius?: number | string;
    borderBottomLeftRadius?: number | string;
    borderBottomRightRadius?: number | string;
    backgroundColor?: string;
    color?: string;
    fontFamily?: string;
    fontSize?: number | string;
    fontStyle?: 'normal' | 'italic';
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | number;
    lineHeight?: number | string;
    letterSpacing?: number | string;
    textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
    textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
    textDecorationLine?: 'none' | 'underline' | 'line-through' | 'underline line-through';
    textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
    fontVariant?: string | string[];
    display?: 'flex' | 'none' | 'contents';
    overflow?: 'visible' | 'hidden' | 'scroll';
    overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
    overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';
    opacity?: number;
    gap?: number | string;
    rowGap?: number | string;
    columnGap?: number | string;
    zIndex?: number;
    animation?: string;
    transform?: string;
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
    elevation?: number;
    aspectRatio?: number;
    [key: string]: unknown;
  };

  type StyleProp = RNStyle | (RNStyle | null | undefined | false)[] | null;

  export interface ViewProps {
    style?: StyleProp;
    children?: ReactNode;
    key?: string | number;
    [key: string]: unknown;
  }
  export type View = ComponentType<ViewProps>;
  export const View: View;

  export interface ImageProps {
    source: { uri: string } | number;
    style?: StyleProp;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
    [key: string]: unknown;
  }
  export type Image = ComponentType<ImageProps>;
  export const Image: Image;

  export interface TextProps {
    style?: StyleProp;
    children?: ReactNode;
    numberOfLines?: number;
    ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
    [key: string]: unknown;
  }
  export type Text = ComponentType<TextProps>;
  export const Text: Text;

  export interface ScrollViewProps {
    style?: StyleProp;
    children?: ReactNode;
    contentContainerStyle?: StyleProp;
    [key: string]: unknown;
  }
  export type ScrollView = ComponentType<ScrollViewProps>;
  export const ScrollView: ScrollView;

  export interface PressableStateCallbackType {
    pressed: boolean;
    hovered?: boolean;
  }
  export interface PressableProps {
    style?: StyleProp | ((state: PressableStateCallbackType) => StyleProp);
    onPress?: () => void;
    disabled?: boolean;
    children?: ReactNode;
    hitSlop?: number | { top: number; bottom: number; left: number; right: number };
    [key: string]: unknown;
  }
  export type Pressable = ComponentType<PressableProps>;
  export const Pressable: Pressable;

  export interface TextInputProps {
    style?: StyleProp;
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    multiline?: boolean;
    numberOfLines?: number;
    textAlign?: 'left' | 'right' | 'center';
    [key: string]: unknown;
  }
  export type TextInput = ComponentType<TextInputProps>;
  export const TextInput: TextInput;

  export interface FlatListProps<T> {
    data: T[];
    renderItem: (info: { item: T; index: number }) => ReactNode;
    keyExtractor: (item: T, index: number) => string;
    style?: StyleProp;
    ItemSeparatorComponent?: ComponentType<unknown>;
    ListEmptyComponent?: ComponentType<unknown> | ReactNode;
    [key: string]: unknown;
  }
  export const FlatList: <T>(props: FlatListProps<T>) => ReactNode;

  export const Alert: {
    alert: (
      title: string,
      message?: string,
      buttons?: { text: string; onPress?: () => void; style?: string }[]
    ) => void;
  };

  export interface I18nManagerStatic {
    isRTL: boolean;
    allowRTL(allow: boolean): void;
    forceRTL(force: boolean): void;
    swapLeftAndRightInRTL(swap: boolean): void;
  }
  export const I18nManager: I18nManagerStatic;

  export interface PlatformStatic {
    OS: 'ios' | 'android' | 'web';
    select<T>(spec: { ios?: T; android?: T; web?: T; default?: T }): T;
  }
  export const Platform: PlatformStatic;

  export const StyleSheet: {
    create<T extends Record<string, RNStyle>>(styles: T): T;
    flatten(styles: (RNStyle | null | undefined | false)[]): RNStyle;
  };
}
