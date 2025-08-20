import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SafeContainer from '../components/SafeContainer';
import InvoiceProcessModal from '../components/InvoiceProcessModal';
import { InvoiceData } from '../lib/invoiceService';

export default function InvoiceDemo() {
  const [modalVisible, setModalVisible] = useState(false);
  const [lastProcessedInvoice, setLastProcessedInvoice] = useState<InvoiceData | null>(null);
  const router = useRouter();

  const handleInvoiceProcessed = (invoiceData: InvoiceData) => {
    console.log('📄 Nota fiscal processada:', invoiceData);
    setLastProcessedInvoice(invoiceData);
  };

  return (
    <SafeContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Demo - Processamento de Nota Fiscal</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Funcionalidades</Text>
            <Text style={styles.description}>
              Este demo demonstra o processamento de notas fiscais eletrônicas (NFCe/NFe) através de:
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Ionicons name="qr-code" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Scanner de QR Code da nota fiscal</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Ionicons name="create-outline" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Entrada manual de URL</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Ionicons name="document-text" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Processamento automático do XML</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Ionicons name="list" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Comparação com listas de compras</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Ionicons name="sync" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Atualização automática de listas</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.buttonText}>Processar Nota Fiscal</Text>
            </TouchableOpacity>
            
            <Text style={styles.hint}>
              Toque no botão acima para abrir o scanner de QR Code ou inserir manualmente a URL da nota fiscal
            </Text>
          </View>

          {lastProcessedInvoice && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Última Nota Processada</Text>
              <View style={styles.invoiceCard}>
                <Text style={styles.invoiceInfo}>
                  <Text style={styles.label}>Loja: </Text>
                  <Text>{lastProcessedInvoice.storeName}</Text>
                </Text>
                <Text style={styles.invoiceInfo}>
                  <Text style={styles.label}>Número: </Text>
                  <Text>{lastProcessedInvoice.number}</Text>
                </Text>
                <Text style={styles.invoiceInfo}>
                  <Text style={styles.label}>Data: </Text>
                  <Text>{new Date(lastProcessedInvoice.date).toLocaleDateString('pt-BR')}</Text>
                </Text>
                <Text style={styles.invoiceInfo}>
                  <Text style={styles.label}>Total: </Text>
                  <Text>R$ {lastProcessedInvoice.totalAmount.toFixed(2)}</Text>
                </Text>
                <Text style={styles.invoiceInfo}>
                  <Text style={styles.label}>Produtos: </Text>
                  <Text>{lastProcessedInvoice.products.length} itens</Text>
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Como Usar</Text>
            <View style={styles.stepList}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  Toque em "Processar Nota Fiscal" para abrir o scanner
                </Text>
              </View>
              
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  Escaneie o QR Code da nota fiscal ou insira a URL manualmente
                </Text>
              </View>
              
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>
                  Aguarde o processamento automático do XML da nota
                </Text>
              </View>
              
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>
                  Visualize os produtos extraídos e compare com suas listas
                </Text>
              </View>
            </View>
          </View>
        </View>

        <InvoiceProcessModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onInvoiceProcessed={handleInvoiceProcessed}
        />
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  invoiceCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  invoiceInfo: {
    fontSize: 14,
    color: '#333',
  },
  label: {
    fontWeight: '600',
    color: '#007AFF',
  },
  stepList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
});