import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated, Dimensions } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BarcodeValidator, BarcodeResult } from '../lib/barcode';

interface BarcodeScannerProps {
  onBarcodeScanned: (result: BarcodeResult) => void;
  onClose: () => void;
  onManualEntry: () => void;
}

// Performance optimization constants
const SCAN_DEBOUNCE_TIME = 1500; // Increased debounce time
const SCAN_REGION_RATIO = 0.7; // 70% of screen for scan region
const MAX_SCAN_ATTEMPTS = 10; // Maximum scan attempts before suggesting manual entry
const CAMERA_TIMEOUT = 15000; // 15 seconds timeout for camera initialization
const PERFORMANCE_MODE = {
  HIGH_PERFORMANCE: 'high',
  BALANCED: 'balanced',
  BATTERY_SAVER: 'battery'
} as const;

type PerformanceMode = typeof PERFORMANCE_MODE[keyof typeof PERFORMANCE_MODE];

export default function BarcodeScanner({ 
  onBarcodeScanned, 
  onClose, 
  onManualEntry 
}: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [scanLineAnimation] = useState(new Animated.Value(0));
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [cameraHealthCheck, setCameraHealthCheck] = useState<NodeJS.Timeout | null>(null);
  
  // Performance optimization states
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(PERFORMANCE_MODE.BALANCED);
  const [scanRegion, setScanRegion] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [consecutiveFailedScans, setConsecutiveFailedScans] = useState(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const scanAttemptCountRef = useRef(0);
  
  // Battery and camera optimization states
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [isInactive, setIsInactive] = useState(false);
  const [autoFlashEnabled, setAutoFlashEnabled] = useState(true);
  const [cameraResolution, setCameraResolution] = useState<'low' | 'medium' | 'high'>('medium');
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [batteryOptimizationActive, setBatteryOptimizationActive] = useState(false);
  
  // Get screen dimensions for scan region calculation
  const screenDimensions = Dimensions.get('window');
  
  // Camera optimization constants
  const INACTIVITY_TIMEOUT = 30000; // 30 seconds of inactivity before optimization
  const BATTERY_SAVE_TIMEOUT = 60000; // 1 minute before aggressive battery saving
  const AUTO_FLASH_THRESHOLD = 0.3; // Threshold for auto flash activation (0-1)

  // Calculate optimal scan region based on screen size
  const calculateScanRegion = useCallback(() => {
    const { width, height } = screenDimensions;
    const scanWidth = width * SCAN_REGION_RATIO;
    const scanHeight = scanWidth * 0.6; // 3:2 aspect ratio for barcode scanning
    const x = (width - scanWidth) / 2;
    const y = (height - scanHeight) / 2;
    
    setScanRegion({ width: scanWidth, height: scanHeight, x, y });
  }, [screenDimensions]);

  // Determinar modo de performance baseado nas capacidades do dispositivo e bateria
  const determinePerformanceMode = useCallback((): PerformanceMode => {
    // Em um app real, você verificaria specs do dispositivo, nível de bateria, etc.
    // Por enquanto, usamos uma heurística simples baseada no tamanho da tela
    const { width, height } = screenDimensions;
    const screenArea = width * height;
    
    if (screenArea > 2000000) { // Dispositivos high-end
      return PERFORMANCE_MODE.HIGH_PERFORMANCE;
    } else if (screenArea > 1000000) { // Dispositivos mid-range
      return PERFORMANCE_MODE.BALANCED;
    } else { // Dispositivos mais simples
      return PERFORMANCE_MODE.BATTERY_SAVER;
    }
  }, [screenDimensions]);

  // Determinar resolução da câmera baseada no modo de performance
  const determineCameraResolution = useCallback((): 'low' | 'medium' | 'high' => {
    switch (performanceMode) {
      case PERFORMANCE_MODE.HIGH_PERFORMANCE:
        return 'high';
      case PERFORMANCE_MODE.BATTERY_SAVER:
        return 'low';
      default:
        return 'medium';
    }
  }, [performanceMode]);

  // Gerenciar inatividade da câmera para economia de bateria
  const resetInactivityTimer = useCallback(() => {
    const now = Date.now();
    setLastActivityTime(now);
    setIsInactive(false);
    setBatteryOptimizationActive(false);

    // Limpar timer existente
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    // Configurar novo timer de inatividade
    const newTimer = setTimeout(() => {
      console.log('Câmera inativa - ativando otimizações de bateria');
      setIsInactive(true);
      
      // Após mais tempo, ativar economia agressiva de bateria
      setTimeout(() => {
        setBatteryOptimizationActive(true);
        console.log('Ativando economia agressiva de bateria');
      }, BATTERY_SAVE_TIMEOUT - INACTIVITY_TIMEOUT);
      
    }, INACTIVITY_TIMEOUT);

    setInactivityTimer(newTimer);
  }, [inactivityTimer]);

  // Detectar condições de iluminação para flash automático
  const shouldUseAutoFlash = useCallback((lightLevel?: number): boolean => {
    if (!autoFlashEnabled) return false;
    
    // Em um app real, você usaria sensores de luz ou análise de imagem
    // Por enquanto, usamos uma heurística baseada no horário
    const hour = new Date().getHours();
    const isDarkTime = hour < 7 || hour > 19; // Antes das 7h ou depois das 19h
    
    // Se temos dados de nível de luz, usar isso
    if (lightLevel !== undefined) {
      return lightLevel < AUTO_FLASH_THRESHOLD;
    }
    
    // Fallback para heurística de horário
    return isDarkTime;
  }, [autoFlashEnabled]);

  // Otimizar configurações da câmera baseado no modo de performance
  const getCameraSettings = useCallback(() => {
    const resolution = determineCameraResolution();
    
    return {
      resolution,
      frameRate: performanceMode === PERFORMANCE_MODE.HIGH_PERFORMANCE ? 30 : 
                 performanceMode === PERFORMANCE_MODE.BATTERY_SAVER ? 15 : 24,
      focusMode: batteryOptimizationActive ? 'fixed' : 'continuous-auto',
      flashMode: flashOn ? 'on' : (shouldUseAutoFlash() ? 'auto' : 'off'),
      scanInterval: performanceMode === PERFORMANCE_MODE.HIGH_PERFORMANCE ? 100 : 
                   performanceMode === PERFORMANCE_MODE.BATTERY_SAVER ? 400 : 200
    };
  }, [performanceMode, batteryOptimizationActive, flashOn, shouldUseAutoFlash, determineCameraResolution]);

  // Advanced debounce with duplicate detection
  const debouncedScanHandler = useCallback((code: string, type: string) => {
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Check if this is the same code as the last scan (avoid duplicates)
    if (lastScannedCodeRef.current === code) {
      console.log('Duplicate scan detected, ignoring');
      return;
    }

    // Set debounce timeout based on performance mode
    const debounceTime = performanceMode === PERFORMANCE_MODE.HIGH_PERFORMANCE 
      ? SCAN_DEBOUNCE_TIME * 0.7 
      : performanceMode === PERFORMANCE_MODE.BATTERY_SAVER 
      ? SCAN_DEBOUNCE_TIME * 1.5 
      : SCAN_DEBOUNCE_TIME;

    debounceTimeoutRef.current = setTimeout(() => {
      handleBarCodeScanned({ type, data: code });
    }, debounceTime);
  }, [performanceMode]);

  useEffect(() => {
    calculateScanRegion();
    setPerformanceMode(determinePerformanceMode());
    setCameraResolution(determineCameraResolution());
  }, [calculateScanRegion, determinePerformanceMode, determineCameraResolution]);

  // Gerenciar timer de inatividade
  useEffect(() => {
    if (cameraReady && !scanned) {
      resetInactivityTimer();
    }
    
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
    };
  }, [cameraReady, scanned, resetInactivityTimer]);

  // Limpar timers ao desmontar componente
  useEffect(() => {
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const initializeCamera = async () => {
      try {
        console.log('Inicializando câmera...');
        
        // Timeout para inicialização da câmera (increased for better reliability)
        const initTimeout = setTimeout(() => {
          if (!cameraReady && !cameraError) {
            console.warn('Timeout na inicialização da câmera');
            setCameraError('Tempo limite para inicializar a câmera. Tente novamente ou use a entrada manual.');
            setHasPermission(false);
          }
        }, CAMERA_TIMEOUT);
        
        const isAvailable = await checkCameraAvailability();
        if (isAvailable) {
          await requestCameraPermission();
        }
        
        clearTimeout(initTimeout);
      } catch (error) {
        console.error('Erro na inicialização da câmera:', error);
        setCameraError('Erro inesperado ao inicializar a câmera. Use a entrada manual.');
        setHasPermission(false);
      }
    };
    
    initializeCamera();
    
    // Cleanup
    return () => {
      stopCameraHealthCheck();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (cameraReady && !scanned) {
      startScanLineAnimation();
      startCameraHealthCheck();
    } else {
      stopCameraHealthCheck();
    }
    
    return () => {
      stopCameraHealthCheck();
    };
  }, [cameraReady, scanned]);

  const startCameraHealthCheck = () => {
    // Verificar saúde da câmera a cada 10 segundos
    const healthCheck = setInterval(() => {
      if (!cameraReady) {
        console.warn('Câmera não está pronta - possível problema');
        setCameraError('Câmera parou de responder');
        stopCameraHealthCheck();
      }
    }, 10000);
    
    setCameraHealthCheck(healthCheck);
  };

  const stopCameraHealthCheck = () => {
    if (cameraHealthCheck) {
      clearInterval(cameraHealthCheck);
      setCameraHealthCheck(null);
    }
  };

  const startScanLineAnimation = () => {
    scanLineAnimation.setValue(0);
    
    // Adjust animation speed based on performance mode
    const animationDuration = performanceMode === PERFORMANCE_MODE.HIGH_PERFORMANCE ? 1500 :
                             performanceMode === PERFORMANCE_MODE.BATTERY_SAVER ? 3000 : 2000;
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnimation, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnimation, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const requestCameraPermission = async () => {
    try {
      setIsRequestingPermission(true);
      setCameraError(null);
      console.log('Solicitando permissão da câmera...');

      // Primeiro verificar se já temos permissão
      const { status: currentStatus } = await Camera.getCameraPermissionsAsync();
      console.log('Status atual da permissão:', currentStatus);
      
      if (currentStatus === 'granted') {
        console.log('Permissão já concedida');
        setHasPermission(true);
        return;
      }

      if (currentStatus === 'denied') {
        console.log('Permissão foi negada anteriormente');
        setCameraError('Permissão da câmera foi negada anteriormente. Vá em Configurações para permitir o acesso.');
        setHasPermission(false);
        return;
      }

      // Se não temos permissão, solicitar com timeout
      console.log('Solicitando nova permissão...');
      
      // Solicitar permissão diretamente
      console.log('Chamando Camera.requestCameraPermissionsAsync()...');
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log('Status da nova permissão:', status);
      
      setHasPermission(status === 'granted');
      
      if (status === 'denied') {
        setCameraError('Permissão da câmera negada. Para usar o scanner, vá em Configurações do dispositivo e permita o acesso à câmera.');
      } else if (status === 'undetermined') {
        setCameraError('Permissão da câmera não foi determinada. Tente novamente.');
      } else if (status !== 'granted') {
        setCameraError('Não foi possível obter permissão da câmera. Use a entrada manual para continuar.');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão da câmera:', error);
      
      // Analisar diferentes tipos de erro
      let errorMessage = 'Erro ao acessar a câmera';
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('not available') || message.includes('no camera')) {
          errorMessage = 'Este dispositivo não possui câmera ou a câmera não está disponível';
        } else if (message.includes('permission')) {
          errorMessage = 'Erro de permissão da câmera. Verifique as configurações do dispositivo.';
        } else if (message.includes('busy') || message.includes('in use')) {
          errorMessage = 'A câmera está sendo usada por outro aplicativo. Feche outros apps que possam estar usando a câmera.';
        } else if (message.includes('hardware')) {
          errorMessage = 'Erro de hardware da câmera. Reinicie o dispositivo e tente novamente.';
        } else {
          errorMessage = 'Erro inesperado ao acessar a câmera. Use a entrada manual como alternativa.';
        }
      }
      
      setCameraError(errorMessage);
      setHasPermission(false);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleCameraError = (error: any) => {
    console.error('Erro da câmera:', error);
    
    let errorMessage = 'Erro ao inicializar a câmera';
    let shouldAutoRetry = false;
    let isRecoverable = true;
    
    // Identificar tipo específico de erro
    if (error?.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('permission')) {
        errorMessage = 'Permissão da câmera negada. Verifique as configurações do dispositivo.';
        isRecoverable = true;
      } else if (message.includes('busy') || message.includes('in use')) {
        errorMessage = 'Câmera está sendo usada por outro aplicativo. Feche outros apps e tente novamente.';
        shouldAutoRetry = true;
        isRecoverable = true;
      } else if (message.includes('not available') || message.includes('no camera')) {
        errorMessage = 'Câmera não disponível neste dispositivo. Use a entrada manual.';
        isRecoverable = false;
      } else if (message.includes('hardware') || message.includes('device')) {
        errorMessage = 'Erro de hardware da câmera. Reinicie o dispositivo.';
        isRecoverable = true;
      } else if (message.includes('timeout') || message.includes('failed to start')) {
        errorMessage = 'Tempo limite para inicializar a câmera. Tentando novamente...';
        shouldAutoRetry = true;
        isRecoverable = true;
      } else if (message.includes('format') || message.includes('configuration')) {
        errorMessage = 'Configuração da câmera não suportada neste dispositivo.';
        isRecoverable = false;
      } else {
        errorMessage = 'Erro inesperado da câmera. Use a entrada manual como alternativa.';
        isRecoverable = true;
      }
    }
    
    setCameraError(errorMessage);
    setCameraReady(false);
    setHasPermission(isRecoverable);
    stopCameraHealthCheck();
    
    // Tentar recuperação automática para erros temporários
    if (shouldAutoRetry && isRecoverable) {
      setTimeout(() => {
        console.log('Tentando recuperação automática da câmera...');
        retryCamera();
      }, 3000);
    }
  };

  const retryCamera = async () => {
    console.log('Iniciando retry da câmera...');
    
    // Reset do estado
    setCameraError(null);
    setCameraReady(false);
    setScanned(false);
    setIsRequestingPermission(true);
    
    try {
      // Pequeno delay para permitir que recursos sejam liberados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar disponibilidade novamente
      const isAvailable = await checkCameraAvailability();
      if (!isAvailable) {
        return; // checkCameraAvailability já definiu o erro
      }
      
      // Tentar solicitar permissão novamente
      await requestCameraPermission();
    } catch (error) {
      console.error('Erro durante retry da câmera:', error);
      setCameraError('Falha ao tentar reconectar com a câmera. Use a entrada manual.');
      setHasPermission(false);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const checkCameraAvailability = async () => {
    try {
      // Verificar se temos permissão para acessar a câmera
      const { status } = await Camera.getCameraPermissionsAsync();
      
      if (status === 'denied') {
        setCameraError('Permissão da câmera foi negada anteriormente');
        setHasPermission(false);
        return false;
      }

      // Para dispositivos móveis, assumimos que há câmera traseira
      // Se não houver, o erro será capturado no onMountError
      return true;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade da câmera:', error);
      setCameraError('Não foi possível verificar a disponibilidade da câmera');
      setHasPermission(false);
      return false;
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    // Enhanced debounce with time and duplicate checking
    const now = Date.now();
    if (now - lastScanTime < SCAN_DEBOUNCE_TIME) {
      return;
    }
    
    // Increment scan attempt counter
    scanAttemptCountRef.current += 1;
    
    console.log(`Código detectado: ${data} (tipo: ${type}) - Tentativa ${scanAttemptCountRef.current}`);
    setScanned(true);
    setLastScanTime(now);
    setScanCount(prev => prev + 1);
    lastScannedCodeRef.current = data;
    
    // Validar formato do código de barras usando o serviço
    const result = BarcodeValidator.validateBarcode(data, type);
    
    if (result.isValid) {
      // Reset consecutive failed scans on success
      setConsecutiveFailedScans(0);
      
      // Verificar se é um código de produto
      if (BarcodeValidator.isProductBarcode(result)) {
        // Para QR codes, tentar extrair código de produto
        if (result.format === 'qr') {
          const productCode = BarcodeValidator.extractProductCodeFromQR(result.data);
          if (productCode) {
            result.data = productCode;
          }
        }
        
        console.log(`Código de produto válido detectado: ${result.data}`);
        
        // Adaptive delay based on performance mode
        const feedbackDelay = performanceMode === PERFORMANCE_MODE.HIGH_PERFORMANCE ? 300 : 500;
        setTimeout(() => {
          onBarcodeScanned(result);
        }, feedbackDelay);
      } else {
        handleInvalidProductCode();
      }
    } else {
      handleInvalidBarcodeFormat(result);
    }
  };

  const handleInvalidProductCode = () => {
    setConsecutiveFailedScans(prev => prev + 1);
    
    // After multiple failed attempts, suggest manual entry more prominently
    if (consecutiveFailedScans >= 3) {
      Alert.alert(
        'Código Não Reconhecido',
        'Vários códigos não foram reconhecidos como produtos. Você pode tentar a entrada manual para maior precisão.',
        [
          { text: 'Continuar Escaneando', onPress: () => resetScan() },
          { text: 'Entrada Manual', onPress: onManualEntry, style: 'default' }
        ]
      );
    } else {
      Alert.alert(
        'Código Não Reconhecido',
        'O código escaneado não parece ser um código de produto. Verifique se é um código de barras de produto alimentício.',
        [
          { text: 'Tentar Novamente', onPress: () => resetScan() },
          { text: 'Entrada Manual', onPress: onManualEntry }
        ]
      );
    }
  };

  const handleInvalidBarcodeFormat = (result: BarcodeResult) => {
    setConsecutiveFailedScans(prev => prev + 1);
    const formatInfo = BarcodeValidator.getBarcodeFormatInfo(result.format);
    
    Alert.alert(
      'Código Inválido',
      `O código escaneado não é um ${formatInfo.name} válido. Verifique se o código está legível e tente novamente.`,
      [
        { text: 'Tentar Novamente', onPress: () => resetScan() },
        { text: 'Entrada Manual', onPress: onManualEntry }
      ]
    );
  };

  const resetScan = () => {
    setScanned(false);
    setLastScanTime(0);
    lastScannedCodeRef.current = '';
    
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    // Check if we should suggest manual entry after many attempts
    if (scanAttemptCountRef.current >= MAX_SCAN_ATTEMPTS) {
      Alert.alert(
        'Muitas Tentativas',
        'Você já tentou escanear várias vezes. A entrada manual pode ser mais eficiente para este código.',
        [
          { text: 'Continuar Escaneando', onPress: () => {
            scanAttemptCountRef.current = 0; // Reset counter
          }},
          { text: 'Entrada Manual', onPress: onManualEntry, style: 'default' }
        ]
      );
    }
  };

  const toggleFlash = async () => {
    try {
      if (!cameraReady) {
        Alert.alert(
          'Câmera não está pronta',
          'Aguarde a câmera inicializar antes de usar o flash.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Resetar timer de inatividade
      resetInactivityTimer();

      // Alternar flash manual (desabilita auto flash temporariamente)
      if (!flashOn) {
        setAutoFlashEnabled(false);
      }
      
      setFlashOn(!flashOn);
      
      // Reabilitar auto flash após 10 segundos se flash foi desligado
      if (flashOn) {
        setTimeout(() => {
          setAutoFlashEnabled(true);
        }, 10000);
      }
    } catch (error) {
      console.error('Erro ao alternar flash:', error);
      Alert.alert(
        'Erro do Flash',
        'Não foi possível alterar o flash da câmera. Verifique se outro app não está usando a câmera.',
        [{ text: 'OK' }]
      );
    }
  };

  // Função para ativar/desativar economia de bateria manualmente
  const toggleBatterySaver = () => {
    setBatteryOptimizationActive(!batteryOptimizationActive);
    resetInactivityTimer();
  };

  if (hasPermission === null || isRequestingPermission) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <Ionicons name="camera" size={64} color="white" />
        <Text className="text-white text-lg mt-4">
          {isRequestingPermission ? 'Solicitando permissão da câmera...' : 'Verificando câmera...'}
        </Text>
      </View>
    );
  }

  if (hasPermission === false || cameraError) {
    const isPermissionError = cameraError?.includes('permissão') || cameraError?.includes('negada') || cameraError?.includes('permission');
    const isHardwareError = cameraError?.includes('hardware') || cameraError?.includes('não disponível') || cameraError?.includes('not available');
    const isBusyError = cameraError?.includes('sendo usada') || cameraError?.includes('busy') || cameraError?.includes('in use');
    const isConfigError = cameraError?.includes('configuração') || cameraError?.includes('configuration');
    
    // Determinar ícone apropriado
    let iconName: keyof typeof Ionicons.glyphMap = "camera-outline";
    if (isPermissionError) iconName = "lock-closed-outline";
    else if (isHardwareError) iconName = "hardware-chip-outline";
    else if (isBusyError) iconName = "time-outline";
    else if (isConfigError) iconName = "settings-outline";
    
    // Determinar título
    let title = 'Problema com a Câmera';
    if (isPermissionError) title = 'Acesso à Câmera Negado';
    else if (isHardwareError) title = 'Câmera Indisponível';
    else if (isBusyError) title = 'Câmera em Uso';
    else if (isConfigError) title = 'Configuração Não Suportada';
    
    return (
      <View className="flex-1 justify-center items-center bg-black p-6">
        <Ionicons 
          name={iconName} 
          size={64} 
          color="white" 
        />
        <Text className="text-white text-xl font-bold mt-4 text-center">
          {title}
        </Text>
        <Text className="text-gray-300 text-base mt-2 text-center px-4">
          {cameraError || 'Não foi possível acessar a câmera'}
        </Text>
        
        <View className="mt-6 space-y-3">
          {/* Botão de tentar novamente - disponível para a maioria dos erros */}
          {!isHardwareError && !isConfigError && (
            <TouchableOpacity
              onPress={retryCamera}
              className="bg-green-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Tentar Novamente</Text>
            </TouchableOpacity>
          )}
          
          {/* Botão para abrir configurações se for erro de permissão */}
          {isPermissionError && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Permissão da Câmera',
                  'Para usar o scanner de código de barras, você precisa permitir o acesso à câmera nas configurações do dispositivo.\n\n1. Vá em Configurações\n2. Encontre o Expo Go\n3. Permita o acesso à Câmera',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Abrir Configurações', onPress: () => {
                      // No Expo Go, não podemos abrir as configurações diretamente
                      // Mas podemos dar instruções claras
                      console.log('Usuário deve abrir configurações manualmente');
                    }}
                  ]
                );
              }}
              className="bg-orange-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Configurações</Text>
            </TouchableOpacity>
          )}
          
          {/* Entrada manual - sempre disponível */}
          <TouchableOpacity
            onPress={onManualEntry}
            className="bg-blue-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Entrada Manual</Text>
          </TouchableOpacity>
          
          {/* Fechar */}
          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-600 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Fechar</Text>
          </TouchableOpacity>
        </View>

        {/* Dicas específicas por tipo de erro */}
        {isPermissionError && (
          <View className="mt-6 bg-yellow-600/20 p-4 rounded-lg border border-yellow-600/30">
            <Text className="text-yellow-200 text-sm text-center font-medium">
              💡 Como permitir acesso à câmera:
            </Text>
            <Text className="text-gray-300 text-xs mt-2 text-center">
              Configurações → Privacidade → Câmera → {'\n'}
              Encontre este app e ative a permissão
            </Text>
          </View>
        )}

        {isHardwareError && (
          <View className="mt-6 bg-red-600/20 p-4 rounded-lg border border-red-600/30">
            <Text className="text-red-200 text-sm text-center font-medium">
              📱 Câmera não disponível
            </Text>
            <Text className="text-gray-300 text-xs mt-2 text-center">
              Use a "Entrada Manual" para digitar o código de barras
            </Text>
          </View>
        )}

        {isBusyError && (
          <View className="mt-6 bg-orange-600/20 p-4 rounded-lg border border-orange-600/30">
            <Text className="text-orange-200 text-sm text-center font-medium">
              ⏳ Câmera ocupada
            </Text>
            <Text className="text-gray-300 text-xs mt-2 text-center">
              Feche outros apps que possam estar usando a câmera e tente novamente
            </Text>
          </View>
        )}

        {isConfigError && (
          <View className="mt-6 bg-purple-600/20 p-4 rounded-lg border border-purple-600/30">
            <Text className="text-purple-200 text-sm text-center font-medium">
              ⚙️ Configuração não suportada
            </Text>
            <Text className="text-gray-300 text-xs mt-2 text-center">
              Este dispositivo não suporta a configuração de câmera necessária
            </Text>
          </View>
        )}
      </View>
    );
  }

  const handleCameraTouch = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setFocusPoint({ x: locationX, y: locationY });
    
    // Resetar timer de inatividade quando usuário interage
    resetInactivityTimer();
    
    // Remover ponto de foco após 2 segundos
    setTimeout(() => {
      setFocusPoint(null);
    }, 2000);
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ 
          flex: 1,
          // Reduzir opacidade quando inativo para economia de bateria
          opacity: batteryOptimizationActive ? 0.8 : 1
        }}
        facing="back"
        flash={getCameraSettings().flashMode as any}
        autofocus={getCameraSettings().focusMode === 'continuous-auto' ? 'on' : 'off'}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8', 
            'upc_a',
            'upc_e',
            'qr'
          ],
          // Otimização de região de interesse e intervalo baseado na performance
          ...(scanRegion.width > 0 && {
            interval: batteryOptimizationActive ? 500 : getCameraSettings().scanInterval
          })
        }}
        onBarcodeScanned={scanned || batteryOptimizationActive ? undefined : (barcode) => {
          resetInactivityTimer(); // Reset timer quando código é detectado
          debouncedScanHandler(barcode.data, barcode.type);
        }}
        onCameraReady={() => {
          console.log('Câmera pronta para uso');
          setCameraReady(true);
          setCameraError(null);
          scanAttemptCountRef.current = 0;
          resetInactivityTimer(); // Iniciar timer de inatividade
        }}
        onMountError={handleCameraError}
        onTouchStart={handleCameraTouch}
      >
        {/* Overlay de escaneamento */}
        <View className="flex-1 justify-center items-center">
          {/* Status da câmera */}
          {!cameraReady && !cameraError && (
            <View className="absolute top-20 left-0 right-0 items-center">
              <View className="bg-black/70 px-4 py-2 rounded-lg border border-white/20">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
                  <Text className="text-white text-sm">Inicializando câmera...</Text>
                </View>
              </View>
              
              {/* Botão de fallback se a inicialização demorar muito */}
              <TouchableOpacity
                onPress={onManualEntry}
                className="mt-3 bg-blue-600/80 px-4 py-2 rounded-lg border border-blue-400/30"
              >
                <Text className="text-white text-sm">Usar Entrada Manual</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Indicadores de otimização de bateria */}
          {cameraReady && (isInactive || batteryOptimizationActive) && (
            <View className="absolute top-20 left-0 right-0 items-center">
              <View className={`px-4 py-2 rounded-lg border ${
                batteryOptimizationActive 
                  ? 'bg-orange-600/80 border-orange-400/30' 
                  : 'bg-yellow-600/80 border-yellow-400/30'
              }`}>
                <View className="flex-row items-center">
                  <Ionicons 
                    name={batteryOptimizationActive ? "battery-half" : "time"} 
                    size={16} 
                    color="white" 
                  />
                  <Text className="text-white text-sm ml-2">
                    {batteryOptimizationActive 
                      ? 'Economia de bateria ativa' 
                      : 'Câmera inativa - economizando energia'
                    }
                  </Text>
                </View>
              </View>
              
              {batteryOptimizationActive && (
                <TouchableOpacity
                  onPress={() => {
                    setBatteryOptimizationActive(false);
                    resetInactivityTimer();
                  }}
                  className="mt-2 bg-green-600/80 px-3 py-1 rounded border border-green-400/30"
                >
                  <Text className="text-white text-xs">Reativar Câmera</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Indicador de erro temporário */}
          {cameraError && cameraError.includes('sendo usada') && (
            <View className="absolute top-20 left-0 right-0 items-center">
              <View className="bg-orange-600/80 px-4 py-2 rounded-lg border border-orange-400/30">
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={16} color="white" />
                  <Text className="text-white text-sm ml-2">Tentando reconectar...</Text>
                </View>
              </View>
            </View>
          )}

          {/* Área de escaneamento otimizada */}
          <View className="relative">
            <View 
              className={`border-2 rounded-lg ${
                cameraReady ? 'border-white/50' : 'border-gray-500'
              }`}
              style={{
                width: Math.min(scanRegion.width * 0.8, 288), // Max 288px (w-72)
                height: Math.min(scanRegion.height * 0.8, 192), // Max 192px (h-48)
              }}
            >
              {/* Cantos do scanner com animação */}
              <View className={`absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 rounded-tl-lg ${
                cameraReady ? 'border-green-400' : 'border-gray-400'
              }`} />
              <View className={`absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 rounded-tr-lg ${
                cameraReady ? 'border-green-400' : 'border-gray-400'
              }`} />
              <View className={`absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 rounded-bl-lg ${
                cameraReady ? 'border-green-400' : 'border-gray-400'
              }`} />
              <View className={`absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 rounded-br-lg ${
                cameraReady ? 'border-green-400' : 'border-gray-400'
              }`} />
              
              {/* Linha de escaneamento animada com velocidade adaptativa */}
              {cameraReady && !scanned && (
                <Animated.View 
                  className="absolute left-0 right-0 h-0.5 bg-green-400 shadow-lg"
                  style={{
                    transform: [{
                      translateY: scanLineAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.min(scanRegion.height * 0.8, 192)],
                      })
                    }],
                    shadowColor: '#4ade80',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 4,
                  }}
                />
              )}
            </View>
            
            {/* Performance mode indicator */}
            {cameraReady && (
              <View className="absolute -bottom-8 left-0 right-0 items-center">
                <View className="bg-black/60 px-2 py-1 rounded border border-white/20">
                  <Text className="text-white text-xs">
                    {performanceMode === PERFORMANCE_MODE.HIGH_PERFORMANCE ? '🚀 Alto' :
                     performanceMode === PERFORMANCE_MODE.BATTERY_SAVER ? '🔋 Economia' : '⚖️ Balanceado'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Focus point indicator */}
          {focusPoint && (
            <View 
              className="absolute w-16 h-16 border-2 border-yellow-400 rounded-full"
              style={{
                left: focusPoint.x - 32,
                top: focusPoint.y - 32,
              }}
            />
          )}

          <Text className="text-white text-lg font-semibold mt-6 text-center px-4">
            {!cameraReady 
              ? 'Aguarde a câmera inicializar...'
              : scanned
              ? 'Código detectado! Processando...'
              : 'Posicione o código de barras dentro da área'
            }
          </Text>

          {/* Dicas de uso com otimizações */}
          {cameraReady && !scanned && (
            <View className="mt-4 px-6">
              <Text className="text-gray-300 text-sm text-center">
                {batteryOptimizationActive 
                  ? 'Toque na tela para reativar • Modo economia ativo'
                  : 'Toque na tela para focar • Mantenha o código bem iluminado'
                }
              </Text>
              
              {/* Dicas baseadas na performance */}
              {scanCount > 3 && !batteryOptimizationActive && (
                <View className="mt-2 bg-blue-600/20 p-3 rounded-lg border border-blue-400/30">
                  <Text className="text-blue-200 text-xs text-center">
                    💡 Dica: {performanceMode === PERFORMANCE_MODE.BATTERY_SAVER 
                      ? 'Mantenha o código centralizado na área de escaneamento para melhor detecção'
                      : 'Se o código não for detectado, tente ajustar a distância ou usar o flash'
                    }
                  </Text>
                </View>
              )}
              
              {/* Dica sobre flash automático */}
              {autoFlashEnabled && !flashOn && (
                <View className="mt-2 bg-blue-600/20 p-2 rounded border border-blue-400/30">
                  <Text className="text-blue-200 text-xs text-center">
                    🔦 Flash automático ativo - será ativado automaticamente em ambientes escuros
                  </Text>
                </View>
              )}
              
              {/* Mostrar dica após muitas tentativas falhadas */}
              {consecutiveFailedScans >= 2 && (
                <View className="mt-2 bg-orange-600/20 p-3 rounded-lg border border-orange-400/30">
                  <Text className="text-orange-200 text-xs text-center">
                    ⚡ Dica: Códigos danificados ou muito pequenos podem ser difíceis de detectar. 
                    Considere usar a entrada manual.
                  </Text>
                </View>
              )}
              
              {/* Dica sobre economia de bateria */}
              {isInactive && !batteryOptimizationActive && (
                <View className="mt-2 bg-yellow-600/20 p-2 rounded border border-yellow-400/30">
                  <Text className="text-yellow-200 text-xs text-center">
                    🔋 Câmera em modo de economia - toque na tela para reativar completamente
                  </Text>
                </View>
              )}
              
              {/* Contador de tentativas para debug */}
              {scanAttemptCountRef.current > 5 && (
                <View className="mt-2 bg-purple-600/20 p-2 rounded border border-purple-400/30">
                  <Text className="text-purple-200 text-xs text-center">
                    Tentativas: {scanAttemptCountRef.current}/{MAX_SCAN_ATTEMPTS}
                  </Text>
                </View>
              )}
            </View>
          )}

          {scanned && (
            <View className="mt-4 bg-green-600/90 px-6 py-3 rounded-lg">
              <Text className="text-white font-semibold text-center">✓ Código detectado!</Text>
            </View>
          )}
        </View>

        {/* Controles superiores */}
        <View className="absolute top-12 left-0 right-0 flex-row justify-between items-center px-6">
          <TouchableOpacity
            onPress={onClose}
            className="bg-black/60 p-3 rounded-full border border-white/20"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View className="flex-row space-x-2">
            {/* Indicador de resolução da câmera */}
            {cameraReady && (
              <View className="bg-black/60 px-2 py-1 rounded border border-white/20">
                <Text className="text-white text-xs font-medium">
                  {cameraResolution.toUpperCase()}
                </Text>
              </View>
            )}

            {/* Indicador de modo de performance */}
            {cameraReady && (
              <View className={`px-2 py-1 rounded border ${
                batteryOptimizationActive 
                  ? 'bg-orange-600/60 border-orange-400/30'
                  : 'bg-black/60 border-white/20'
              }`}>
                <Text className="text-white text-xs font-medium">
                  {performanceMode === PERFORMANCE_MODE.HIGH_PERFORMANCE ? '🚀' :
                   performanceMode === PERFORMANCE_MODE.BATTERY_SAVER ? '🔋' : '⚖️'}
                </Text>
              </View>
            )}

            {/* Indicador de auto-focus */}
            {cameraReady && (
              <View className="bg-black/60 px-2 py-1 rounded border border-white/20">
                <Text className="text-white text-xs font-medium">
                  {getCameraSettings().focusMode === 'continuous-auto' ? 'AUTO' : 'FIXO'}
                </Text>
              </View>
            )}

            {/* Controle de flash com indicador de auto */}
            <TouchableOpacity
              onPress={toggleFlash}
              className={`bg-black/60 p-3 rounded-full border border-white/20 ${!cameraReady ? 'opacity-50' : ''}`}
              disabled={!cameraReady}
            >
              <View className="relative">
                <Ionicons 
                  name={flashOn ? "flash" : "flash-off"} 
                  size={24} 
                  color={flashOn ? "#fbbf24" : autoFlashEnabled ? "#94a3b8" : "white"} 
                />
                {autoFlashEnabled && !flashOn && (
                  <View className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full" />
                )}
              </View>
            </TouchableOpacity>

            {/* Botão de economia de bateria */}
            <TouchableOpacity
              onPress={toggleBatterySaver}
              className={`p-2 rounded-full border ${
                batteryOptimizationActive 
                  ? 'bg-orange-600/60 border-orange-400/30'
                  : 'bg-black/60 border-white/20'
              }`}
              disabled={!cameraReady}
            >
              <Ionicons 
                name="battery-half" 
                size={20} 
                color={batteryOptimizationActive ? "#fb923c" : "white"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Controles inferiores */}
        <View className="absolute bottom-12 left-0 right-0 items-center px-6">
          <View className="flex-row space-x-4">
            <TouchableOpacity
              onPress={onManualEntry}
              className="bg-blue-600/90 px-6 py-3 rounded-lg border border-blue-400/30"
            >
              <Text className="text-white font-semibold">Entrada Manual</Text>
            </TouchableOpacity>
            
            {scanned && (
              <TouchableOpacity
                onPress={resetScan}
                className="bg-green-600/90 px-6 py-3 rounded-lg border border-green-400/30"
              >
                <Text className="text-white font-semibold">Escanear Novamente</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Indicadores de formato suportado e status */}
          {cameraReady && !scanned && (
            <View className="mt-4 space-y-2">
              <View className="bg-black/60 px-4 py-2 rounded-lg border border-white/20">
                <Text className="text-white text-xs text-center">
                  Suporta: EAN-13, EAN-8, UPC-A, UPC-E, QR Code
                </Text>
              </View>
              
              {/* Status de otimizações */}
              <View className="flex-row justify-center space-x-2">
                <View className={`px-2 py-1 rounded border ${
                  performanceMode === PERFORMANCE_MODE.HIGH_PERFORMANCE 
                    ? 'bg-green-600/20 border-green-400/30'
                    : performanceMode === PERFORMANCE_MODE.BATTERY_SAVER
                    ? 'bg-orange-600/20 border-orange-400/30'
                    : 'bg-blue-600/20 border-blue-400/30'
                }`}>
                  <Text className="text-white text-xs">
                    {performanceMode === PERFORMANCE_MODE.HIGH_PERFORMANCE ? 'Alto Desempenho' :
                     performanceMode === PERFORMANCE_MODE.BATTERY_SAVER ? 'Economia Bateria' : 'Balanceado'}
                  </Text>
                </View>
                
                <View className="bg-black/60 px-2 py-1 rounded border border-white/20">
                  <Text className="text-white text-xs">
                    {cameraResolution.toUpperCase()} • {getCameraSettings().frameRate}fps
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}