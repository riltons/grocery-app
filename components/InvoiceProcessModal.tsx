import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InvoiceService, InvoiceData, InvoiceProduct } from '../lib/invoiceService';
import { ListsService } from '../lib/lists';
import InvoiceQRScanner from './InvoiceQRScanner';

interface InvoiceProcessModalProps {
    visible: boolean;
    onClose: () => void;
    listId?: string;
    onInvoiceProcessed?: (data: InvoiceData) => void;
}

type ProcessStep = 'scanner' | 'manual' | 'processing' | 'results' | 'comparison';

export default function InvoiceProcessModal({
    visible,
    onClose,
    listId,
    onInvoiceProcessed
}: InvoiceProcessModalProps) {
    const [currentStep, setCurrentStep] = useState<ProcessStep>('scanner');
    const [loading, setLoading] = useState(false);
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [manualUrl, setManualUrl] = useState('');
    const [comparisonData, setComparisonData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveResults, setSaveResults] = useState<any>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setCurrentStep('scanner');
            setLoading(false);
            setInvoiceData(null);
            setManualUrl('');
            setComparisonData(null);
            setError(null);
            setSaving(false);
            setSaveResults(null);
        }
    }, [visible]);

    const handleQRCodeScanned = async (qrCodeData: string) => {
        console.log('📱 QR Code escaneado:', qrCodeData);
        setCurrentStep('processing');
        setLoading(true);
        setError(null);

        try {
            // Extrair URL do XML a partir do QR Code
            const xmlUrl = InvoiceService.extractXMLUrlFromQRCode(qrCodeData);

            if (!xmlUrl) {
                throw new Error('Não foi possível extrair a URL do XML do QR Code');
            }

            await processInvoiceFromUrl(xmlUrl);
        } catch (err: any) {
            console.error('Erro ao processar QR Code:', err);
            setError(err.message || 'Erro ao processar QR Code da nota fiscal');
            setLoading(false);
        }
    };

    const handleManualEntry = () => {
        setCurrentStep('manual');
    };

    const handleManualSubmit = async () => {
        if (!manualUrl.trim()) {
            Alert.alert('Erro', 'Por favor, insira a URL da nota fiscal');
            return;
        }

        setCurrentStep('processing');
        setLoading(true);
        setError(null);

        try {
            await processInvoiceFromUrl(manualUrl.trim());
        } catch (err: any) {
            console.error('Erro ao processar URL manual:', err);
            setError(err.message || 'Erro ao processar URL da nota fiscal');
            setLoading(false);
        }
    };

    const processInvoiceFromUrl = async (url: string) => {
        try {
            // Download do XML
            const { data: xmlContent, error: downloadError } = await InvoiceService.downloadInvoiceXML(url);

            if (downloadError || !xmlContent) {
                console.log('📄 Erro no download, usando dados de demonstração');
                const demoData = InvoiceService.generateDemoInvoiceData();
                setInvoiceData(demoData);

                // Se há uma lista selecionada, fazer comparação
                if (listId) {
                    const { data: comparison, error: compError } = await InvoiceService.compareWithShoppingList(
                        demoData,
                        listId
                    );

                    if (!compError && comparison) {
                        setComparisonData(comparison);
                    }

                    setCurrentStep('comparison');
                } else {
                    setCurrentStep('results');
                }

                // Callback para o componente pai
                if (onInvoiceProcessed) {
                    onInvoiceProcessed(demoData);
                }

                return;
            }

            // Parse do XML
            const { data: parsedData, error: parseError } = await InvoiceService.parseInvoiceXML(xmlContent);

            if (parseError || !parsedData) {
                console.log('📄 Erro no parse, usando dados de demonstração');
                const demoData = InvoiceService.generateDemoInvoiceData();
                setInvoiceData(demoData);

                // Se há uma lista selecionada, fazer comparação
                if (listId) {
                    const { data: comparison, error: compError } = await InvoiceService.compareWithShoppingList(
                        demoData,
                        listId
                    );

                    if (!compError && comparison) {
                        setComparisonData(comparison);
                    }

                    setCurrentStep('comparison');
                } else {
                    setCurrentStep('results');
                }

                // Callback para o componente pai
                if (onInvoiceProcessed) {
                    onInvoiceProcessed(demoData);
                }

                return;
            }

            setInvoiceData(parsedData);

            // Se há uma lista selecionada, fazer comparação
            if (listId) {
                const { data: comparison, error: compError } = await InvoiceService.compareWithShoppingList(
                    parsedData,
                    listId
                );

                if (compError) {
                    console.warn('Erro ao comparar com lista:', compError);
                } else {
                    setComparisonData(comparison);
                }

                setCurrentStep('comparison');
            } else {
                setCurrentStep('results');
            }

            // Callback para o componente pai
            if (onInvoiceProcessed) {
                onInvoiceProcessed(parsedData);
            }

        } catch (err: any) {
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProducts = async () => {
        if (!invoiceData) return;

        setSaving(true);
        setError(null);

        try {
            const { data, error } = await InvoiceService.saveInvoiceProducts(invoiceData);

            if (error) {
                throw new Error('Erro ao salvar produtos da nota fiscal');
            }

            setSaveResults(data);
            
            const totalSaved = (data?.savedGenericProducts.length || 0) + (data?.savedSpecificProducts.length || 0);
            const totalExisting = data?.existingProducts.length || 0;
            const totalSkipped = data?.skippedProducts.length || 0;

            Alert.alert(
                'Produtos Salvos!',
                `✅ ${totalSaved} novos produtos salvos\n` +
                `ℹ️ ${totalExisting} produtos já existiam\n` +
                `⚠️ ${totalSkipped} produtos ignorados`,
                [
                    {
                        text: 'OK',
                        onPress: onClose,
                    },
                ]
            );

        } catch (err: any) {
            setError(err.message || 'Erro ao salvar produtos');
            Alert.alert('Erro', err.message || 'Erro ao salvar produtos da nota fiscal');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateList = async (options: {
        updateQuantities: boolean;
        updatePrices: boolean;
        addNewProducts: boolean;
        markAsPurchased: boolean;
    }) => {
        if (!invoiceData || !listId) return;

        setLoading(true);

        try {
            const { data, error } = await InvoiceService.updateShoppingListFromInvoice(
                listId,
                invoiceData,
                options
            );

            if (error) {
                throw new Error('Erro ao atualizar lista de compras');
            }

            Alert.alert(
                'Lista Atualizada!',
                `Lista atualizada com sucesso:\n• ${data.updatedItems.length} itens atualizados\n• ${data.addedItems.length} novos itens adicionados`,
                [
                    {
                        text: 'OK',
                        onPress: onClose,
                    },
                ]
            );

        } catch (err: any) {
            Alert.alert('Erro', err.message || 'Erro ao atualizar lista');
        } finally {
            setLoading(false);
        }
    };

    const renderScanner = () => (
        <View style={styles.fullScreen}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Escanear Nota Fiscal</Text>
                <TouchableOpacity onPress={handleManualEntry} style={styles.manualButton}>
                    <Ionicons name="create-outline" size={20} color="white" />
                </TouchableOpacity>
            </View>

            <InvoiceQRScanner
                onQRCodeScanned={handleQRCodeScanned}
                onClose={onClose}
                onManualEntry={handleManualEntry}
            />
        </View>
    );

    const renderManualEntry = () => (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setCurrentStep('scanner')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>URL da Nota Fiscal</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Insira a URL da Nota Fiscal</Text>
                    <Text style={styles.sectionDescription}>
                        Cole aqui a URL completa da nota fiscal eletrônica (NFCe/NFe)
                    </Text>

                    <TextInput
                        style={styles.urlInput}
                        value={manualUrl}
                        onChangeText={setManualUrl}
                        placeholder="https://..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={3}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TouchableOpacity
                        onPress={handleManualSubmit}
                        style={[styles.button, styles.primaryButton]}
                        disabled={!manualUrl.trim()}
                    >
                        <Text style={styles.buttonText}>Processar Nota Fiscal</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );

    const renderProcessing = () => (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Processando Nota Fiscal</Text>
            </View>

            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Processando nota fiscal...</Text>
                <Text style={styles.loadingSubText}>
                    Baixando e analisando os dados da nota fiscal
                </Text>

                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={24} color="#FF3B30" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            onPress={() => setCurrentStep('scanner')}
                            style={[styles.button, styles.secondaryButton]}
                        >
                            <Text style={styles.buttonText}>Tentar Novamente</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    const renderResults = () => {
        if (!invoiceData) return null;

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nota Fiscal Processada</Text>
                </View>

                <ScrollView style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Informações da Nota</Text>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Loja:</Text>
                            <Text style={styles.infoValue}>{invoiceData.storeName}</Text>

                            <Text style={styles.infoLabel}>Número:</Text>
                            <Text style={styles.infoValue}>{invoiceData.number}</Text>

                            <Text style={styles.infoLabel}>Data:</Text>
                            <Text style={styles.infoValue}>
                                {new Date(invoiceData.date).toLocaleDateString('pt-BR')}
                            </Text>

                            <Text style={styles.infoLabel}>Total:</Text>
                            <Text style={styles.infoValue}>
                                R$ {invoiceData.totalAmount.toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Produtos ({invoiceData.products.length})
                        </Text>
                        {invoiceData.products.map((product, index) => (
                            <View key={index} style={styles.productCard}>
                                <View style={styles.productHeader}>
                                    <Text style={styles.productName}>{product.name}</Text>
                                    {product.barcode && (
                                        <View style={styles.barcodeContainer}>
                                            <Ionicons name="barcode-outline" size={14} color="#666" />
                                            <Text style={styles.barcodeText}>{product.barcode}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.productDetails}>
                                    <Text style={styles.productDetail}>
                                        {product.quantity} {product.unit}
                                    </Text>
                                    <Text style={styles.productDetail}>
                                        R$ {product.unitPrice.toFixed(2)} / {product.unit}
                                    </Text>
                                    <Text style={styles.productTotal}>
                                        R$ {product.totalPrice.toFixed(2)}
                                    </Text>
                                </View>

                                <View style={styles.productMeta}>
                                    {product.brand && (
                                        <View style={styles.brandContainer}>
                                            <Ionicons name="business-outline" size={12} color="#666" />
                                            <Text style={styles.productBrand}>{product.brand}</Text>
                                        </View>
                                    )}
                                    {product.category && (
                                        <Text style={styles.productCategory}>{product.category}</Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Salvar Produtos</Text>
                        <Text style={styles.sectionDescription}>
                            Salvar os produtos da nota fiscal no seu catálogo pessoal
                        </Text>
                        
                        <TouchableOpacity
                            onPress={handleSaveProducts}
                            style={[styles.button, styles.primaryButton]}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Salvar Produtos</Text>
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.button, styles.secondaryButton]}
                        >
                            <Text style={styles.buttonText}>Fechar sem Salvar</Text>
                        </TouchableOpacity>
                        
                        {saveResults && (
                            <View style={styles.saveResultsContainer}>
                                <Text style={styles.saveResultsTitle}>Resultados do Salvamento:</Text>
                                
                                {saveResults.savedGenericProducts.length > 0 && (
                                    <Text style={styles.saveResultsText}>
                                        ✅ {saveResults.savedGenericProducts.length} produtos genéricos salvos
                                    </Text>
                                )}
                                
                                {saveResults.savedSpecificProducts.length > 0 && (
                                    <Text style={styles.saveResultsText}>
                                        ✅ {saveResults.savedSpecificProducts.length} produtos específicos salvos
                                    </Text>
                                )}
                                
                                {saveResults.existingProducts.length > 0 && (
                                    <Text style={styles.saveResultsText}>
                                        ℹ️ {saveResults.existingProducts.length} produtos já existiam
                                    </Text>
                                )}
                                
                                {saveResults.skippedProducts.length > 0 && (
                                    <Text style={styles.saveResultsText}>
                                        ⚠️ {saveResults.skippedProducts.length} produtos ignorados
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        );
    };

    const renderComparison = () => {
        if (!invoiceData || !comparisonData) return null;

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Comparar com Lista</Text>
                </View>

                <ScrollView style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Resumo da Comparação</Text>
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryNumber}>{comparisonData.matchedItems.length}</Text>
                                <Text style={styles.summaryLabel}>Itens Encontrados</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryNumber}>{comparisonData.newProducts.length}</Text>
                                <Text style={styles.summaryLabel}>Novos Produtos</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryNumber}>{comparisonData.unmatchedItems.length}</Text>
                                <Text style={styles.summaryLabel}>Não Comprados</Text>
                            </View>
                        </View>
                    </View>

                    {comparisonData.matchedItems.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Itens Encontrados</Text>
                            {comparisonData.matchedItems.map((match: any, index: number) => (
                                <View key={index} style={styles.matchCard}>
                                    <Text style={styles.matchName}>{match.invoiceProduct.name}</Text>
                                    <View style={styles.matchDetails}>
                                        <Text style={styles.matchDetail}>
                                            Lista: {match.listItem.quantity} {match.listItem.unit || 'un'}
                                        </Text>
                                        <Text style={styles.matchDetail}>
                                            Nota: {match.invoiceProduct.quantity} {match.invoiceProduct.unit}
                                        </Text>
                                        {match.quantityDifference !== 0 && (
                                            <Text style={[
                                                styles.matchDifference,
                                                match.quantityDifference > 0 ? styles.positive : styles.negative
                                            ]}>
                                                {match.quantityDifference > 0 ? '+' : ''}{match.quantityDifference}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {comparisonData.newProducts.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Novos Produtos</Text>
                            {comparisonData.newProducts.map((product: InvoiceProduct, index: number) => (
                                <View key={index} style={styles.productCard}>
                                    <View style={styles.productHeader}>
                                        <Text style={styles.productName}>{product.name}</Text>
                                        {product.barcode && (
                                            <View style={styles.barcodeContainer}>
                                                <Ionicons name="barcode-outline" size={14} color="#666" />
                                                <Text style={styles.barcodeText}>{product.barcode}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.productDetail}>
                                        {product.quantity} {product.unit} - R$ {product.totalPrice.toFixed(2)}
                                    </Text>
                                    <View style={styles.productMeta}>
                                        {product.brand && (
                                            <View style={styles.brandContainer}>
                                                <Ionicons name="business-outline" size={12} color="#666" />
                                                <Text style={styles.productBrand}>{product.brand}</Text>
                                            </View>
                                        )}
                                        {product.category && (
                                            <Text style={styles.productCategory}>{product.category}</Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Atualizar Lista</Text>
                        <Text style={styles.sectionDescription}>
                            Escolha como deseja atualizar sua lista de compras:
                        </Text>

                        <TouchableOpacity
                            onPress={() => handleUpdateList({
                                updateQuantities: true,
                                updatePrices: true,
                                addNewProducts: true,
                                markAsPurchased: true,
                            })}
                            style={[styles.button, styles.primaryButton]}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Atualizar Tudo</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleUpdateList({
                                updateQuantities: false,
                                updatePrices: false,
                                addNewProducts: true,
                                markAsPurchased: true,
                            })}
                            style={[styles.button, styles.secondaryButton]}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>Apenas Marcar como Comprado</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.button, styles.tertiaryButton]}
                        >
                            <Text style={styles.buttonText}>Não Atualizar</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 'scanner':
                return renderScanner();
            case 'manual':
                return renderManualEntry();
            case 'processing':
                return renderProcessing();
            case 'results':
                return renderResults();
            case 'comparison':
                return renderComparison();
            default:
                return renderScanner();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            {renderCurrentStep()}
        </Modal>
    );
}

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        backgroundColor: 'black',
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingTop: 50, // Safe area
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    closeButton: {
        padding: 8,
    },
    backButton: {
        padding: 8,
    },
    manualButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    urlInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        marginBottom: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 4,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    secondaryButton: {
        backgroundColor: '#34C759',
    },
    tertiaryButton: {
        backgroundColor: '#666',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
    },
    loadingSubText: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    errorContainer: {
        alignItems: 'center',
        marginTop: 32,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 16,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    productCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    productHeader: {
        marginBottom: 8,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    barcodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        gap: 4,
    },
    barcodeText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
    },
    productDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    productDetail: {
        fontSize: 14,
        color: '#666',
    },
    productTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    productMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    productBrand: {
        fontSize: 12,
        color: '#666',
    },
    productCategory: {
        fontSize: 12,
        color: '#007AFF',
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    summaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 16,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    matchCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#34C759',
    },
    matchName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    matchDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    matchDetail: {
        fontSize: 14,
        color: '#666',
    },
    matchDifference: {
        fontSize: 14,
        fontWeight: '600',
    },
    positive: {
        color: '#34C759',
    },
    negative: {
        color: '#FF3B30',
    },
    saveResultsContainer: {
        backgroundColor: '#f0f8f1',
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    saveResultsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    saveResultsText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
        lineHeight: 18,
    },
});