import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FABOption {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  options: FABOption[];
  mainIcon?: string;
  mainColor?: string;
}

export default function FloatingActionButton({ 
  options, 
  mainIcon = 'add',
  mainColor = '#4CAF50'
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleFAB = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    setIsOpen(!isOpen);
  };

  const handleOptionPress = (option: FABOption) => {
    setIsOpen(false);
    Animated.spring(animation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    option.onPress();
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* Overlay para fechar o FAB quando clicar fora */}
      {isOpen && (
        <Modal
          transparent
          visible={isOpen}
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableOpacity 
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          >
            <View style={styles.fabContainer}>
              {/* Opções do FAB */}
              {options.map((option, index) => {
                const translateY = animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -(60 * (index + 1))],
                });

                const opacity = animation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0, 1],
                });

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.fabOption,
                      {
                        transform: [{ translateY }],
                        opacity,
                      },
                    ]}
                  >
                    <View style={styles.optionContainer}>
                      <View style={styles.labelContainer}>
                        <Text style={styles.optionLabel}>{option.label}</Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          { backgroundColor: option.color || '#fff' }
                        ]}
                        onPress={() => handleOptionPress(option)}
                      >
                        <Ionicons 
                          name={option.icon as any} 
                          size={24} 
                          color={option.color ? '#fff' : '#333'} 
                        />
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                );
              })}

              {/* Botão principal do FAB */}
              <TouchableOpacity
                style={[styles.fabMain, { backgroundColor: mainColor }]}
                onPress={toggleFAB}
              >
                <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                  <Ionicons name={mainIcon as any} size={24} color="#fff" />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* FAB principal quando fechado */}
      {!isOpen && (
        <View style={styles.fabContainerClosed}>
          <TouchableOpacity
            style={[styles.fabMain, { backgroundColor: mainColor }]}
            onPress={toggleFAB}
          >
            <Ionicons name={mainIcon as any} size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 90, // Espaço para os botões de navegação
    paddingRight: 20,
  },
  fabContainer: {
    alignItems: 'flex-end', // Alinha à direita para as opções não saírem da tela
  },
  fabMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabOption: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'flex-end', // Alinha o conteúdo à direita
  },
  labelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 12,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  optionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fabContainerClosed: {
    position: 'absolute',
    bottom: 90, // Posicionamento para não sobrepor botões de navegação
    right: 20,
    alignItems: 'center',
  },
});