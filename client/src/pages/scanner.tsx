import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Upload, ScanLine, X, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TransactionForm from "@/components/forms/transaction-form";

interface ScannedProduct {
  id?: number;
  name: string;
  barcode?: string;
  brand?: string;
  category?: string;
  lastPrice?: number;
}

export default function Scanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock camera functionality - in a real app, this would use react-webcam and QuaggaJS
  const startCamera = useCallback(async () => {
    try {
      setIsScanning(true);
      setError("");
      
      // Mock camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Mock barcode detection after 3 seconds
      setTimeout(() => {
        const mockBarcode = "123456789012";
        setScannedBarcode(mockBarcode);
        handleBarcodeDetected(mockBarcode);
        stopCamera();
      }, 3000);
      
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
      setIsScanning(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const handleBarcodeDetected = async (barcode: string) => {
    try {
      // Try to find existing product
      const response = await fetch(`/api/products/barcode/${barcode}`);
      
      if (response.ok) {
        const product = await response.json();
        setScannedProduct(product);
        toast({
          title: "Product Found",
          description: `Found ${product.name} in database`,
        });
      } else {
        // Product not found, create placeholder
        setScannedProduct({
          name: "Unknown Product",
          barcode,
          category: "Unknown",
        });
        toast({
          title: "New Product",
          description: "Product not found in database. You can add details manually.",
        });
      }
    } catch (err) {
      setError("Failed to lookup product");
    }
  };

  const handleManualLookup = () => {
    if (manualBarcode.trim()) {
      setScannedBarcode(manualBarcode.trim());
      handleBarcodeDetected(manualBarcode.trim());
    }
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Mock receipt processing
      toast({
        title: "Receipt Processing",
        description: "Receipt uploaded successfully. Processing...",
      });
      
      // Mock extracted transaction data
      setTimeout(() => {
        setScannedProduct({
          name: "Receipt Transaction",
          category: "Groceries",
        });
        toast({
          title: "Receipt Processed",
          description: "Transaction details extracted from receipt",
        });
      }, 2000);
    }
  };

  const createProductMutation = useMutation({
    mutationFn: (productData: any) => apiRequest("POST", "/api/products", productData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setScannedProduct(data);
      toast({
        title: "Success",
        description: "Product added to database",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = () => {
    if (scannedProduct) {
      createProductMutation.mutate({
        name: scannedProduct.name,
        barcode: scannedProduct.barcode,
        brand: scannedProduct.brand || "",
        category: scannedProduct.category || "Unknown",
        lastPrice: scannedProduct.lastPrice || 0,
      });
    }
  };

  const handleCreateTransaction = () => {
    setShowTransactionForm(true);
  };

  const reset = () => {
    setScannedBarcode("");
    setScannedProduct(null);
    setManualBarcode("");
    setError("");
    stopCamera();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-2xl font-semibold text-foreground">Receipt & Product Scanner</h2>
          <Button variant="outline" onClick={reset}>
            <X className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Scanner Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Barcode Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ScanLine className="w-5 h-5 mr-2" />
                  Barcode Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Scan product barcodes to quickly add items
                </p>
                <Button 
                  onClick={startCamera} 
                  disabled={isScanning}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isScanning ? "Scanning..." : "Start Camera"}
                </Button>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Or enter barcode manually:</p>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter barcode"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                    />
                    <Button onClick={handleManualLookup} variant="outline">
                      Lookup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Receipt Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload receipt photos to extract transaction data
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Receipt
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Supports JPG, PNG, and PDF files
                </p>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Scanner Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <p>📱 Hold camera steady over barcode</p>
                  <p>💡 Ensure good lighting</p>
                  <p>📄 Keep receipts flat and clear</p>
                  <p>🔍 Zoom in for small barcodes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Camera View */}
          {isScanning && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Camera View</CardTitle>
                  <Button variant="outline" onClick={stopCamera}>
                    <X className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white border-dashed w-48 h-32 rounded-lg"></div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-center text-white">
                    <p>Position barcode within the frame</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Scanned Result */}
          {scannedProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Check className="w-5 h-5 mr-2 text-accent" />
                  Scanned Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Product Name</label>
                      <Input
                        value={scannedProduct.name}
                        onChange={(e) => setScannedProduct({
                          ...scannedProduct,
                          name: e.target.value
                        })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <Input
                        value={scannedProduct.category || ""}
                        onChange={(e) => setScannedProduct({
                          ...scannedProduct,
                          category: e.target.value
                        })}
                      />
                    </div>
                    
                    {scannedProduct.barcode && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Barcode</label>
                        <Input value={scannedProduct.barcode} readOnly />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Brand</label>
                      <Input
                        value={scannedProduct.brand || ""}
                        onChange={(e) => setScannedProduct({
                          ...scannedProduct,
                          brand: e.target.value
                        })}
                        placeholder="Enter brand"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    {!scannedProduct.id && (
                      <Button 
                        onClick={handleAddProduct}
                        disabled={createProductMutation.isPending}
                      >
                        {createProductMutation.isPending ? "Adding..." : "Add to Product Database"}
                      </Button>
                    )}
                    
                    <Button 
                      onClick={handleCreateTransaction}
                      variant="outline"
                    >
                      Create Transaction
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm
          transaction={scannedProduct ? {
            description: scannedProduct.name,
            amount: scannedProduct.lastPrice || 0,
            type: "expense",
          } : undefined}
          onClose={() => setShowTransactionForm(false)}
        />
      )}
    </div>
  );
}
