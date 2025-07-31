import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Lista de unidades disponíveis
const UNITS = [
  { id: 'un', name: 'Unidade', symbol: 'un', icon: 'cube-outline' },
  { id: 'kg', name: 'Quilograma', symbol: 'kg', icon: 'scale-outline' },
  { id: 'g', name: 'Grama', symbol: 'g', icon: 'scale-outline' },
  { id: 'l', name: 'Litro', symbol: 'L', icon: 'water-outline' },
  { id: 'ml', name: 'Mililitro', symbol: 'ml', icon: 'water-outline' },
  { id: 'pct', name: 'Pacote', symbol: 'pct', icon: 'bag-outline' },
  { id: 'cx', name: 'Caixa', symbol: 'cx', icon: 'cube-outline' },
  { id: 'dz', name: 'Dúzia', symbol: 'dz', icon: 'apps-outline' },
  { id: 'm', name: 'Metro', symbol: 'm', icon: 'resize-outline' },
  { id: 'cm', name: 'Centímetro', symbol: 'cm', icon: 'resize-outline' },
];

type Unit = {
  id: string;
  name: string;
  symbol: string;
  icon: string;
};

type UnitSelectorProps = {
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  disabled?: boolean;
};

export default function UnitSelector({ selectedUnit, onSelectUnit, disabled = false }: UnitSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Encontra a unidade selecionada
  const selectedUnitObj = UNITS.find(unit => unit.id === selectedUnit) || UNITS[0];

  // Renderiza cada item da lista de unidades
  const renderUnitItem = ({ item }: { item: Unit }) => (
    <TouchableOpacity
      style={[
        styles.unitItem,
        selectedUnit === item.id && styles.selectedUnitItem
      ]}
      onPress={() => {
        onSelectUnit(item.id);
        setModalVisible(false);
      }}
    >
      <Ionicons 
        name={item.icon as any} 
        size={24} 
        color={selectedUnit === item.id ? '#4CAF50' : '#666'} 
      />
      <View style={styles.unitInfo}>
        <Text style={[
          styles.unitName,
          selectedUnit === item.id && styles.selectedUnitText
        ]}>
          {item.name}
        </Text>
        <Text style={[
          styles.unitSymbol,
          selectedUnit === item.id && styles.selectedUnitText
        ]}>
          {item.symbol}
        </Text>
      </View>
      {selectedUnit === item.id && (
        <Ionicons name="checkmark" size={20} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          <Ionicons 
            name={selectedUnitObj.icon as any} 
            size={20} 
            color={disabled ? '#ccc' : '#4CAF50'} 
          />
          <Text style={[
            styles.selectorText,
            disabled && styles.selectorTextDisabled
          ]}>
            {selectedUnitObj.name} ({selectedUnitObj.symbol})
          </Text>
        </View>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? '#ccc' : '#666'} 
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Unidade</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={UNITS}
              renderItem={renderUnitItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.unitList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectorDisabled: {
    backgroundColor: '#f9f9f9',
    opacity: 0.6,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  selectorTextDisabled: {
    color: '#ccc',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  unitList: {
    paddingBottom: 20,
  },
  unitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedUnitItem: {
    backgroundColor: '#f0f8f1',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  unitInfo: {
    flex: 1,
    marginLeft: 12,
  },
  unitName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  unitSymbol: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedUnitText: {
    color: '#4CAF50',
  },
});