// Poslední záchrana: když obrazovka spadne, uživatel uvidí obrazovku 33
// (SOMETHING BROKE ON OUR SIDE), ne bílou plochu.
import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F0', padding: 24, justifyContent: 'center', gap: 16 }}>
        <View style={{ width: 56, height: 56, backgroundColor: '#FF2D16', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900' }}>!</Text>
        </View>
        <Text style={{ fontSize: 32, lineHeight: 32, color: '#101010', fontWeight: '900' }}>
          SOMETHING{'\n'}BROKE ON{'\n'}OUR SIDE.
        </Text>
        <Text style={{ fontSize: 15, lineHeight: 22, color: '#5A5A5A' }}>
          Nothing you entered was lost — it is still on this phone.
        </Text>
        <Text style={{ fontSize: 12, color: '#8A8A8A' }}>{String(error.message || error)}</Text>
        <Pressable
          onPress={() => this.setState({ error: null })}
          style={{ backgroundColor: '#FFE500', borderWidth: 3, borderColor: '#101010', padding: 14, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#101010' }}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}
