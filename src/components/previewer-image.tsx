if (!image) return;

    setIsProcessing(true);
    setProgress(0);
    try {
      // Simplified background removal without text detection
      setProgress(20);
      const { removeBackground } = await import("@imgly/background-removal");

      const response = await fetch(image.src);
      const blob = await response.blob();

      setProgress(40);

      // Use the default model which is more conservative for documents
      const processedBlob = await removeBackground(blob, {
        model: 'isnet', // Default model - more conservative for preserving details
        output: {
          format: 'image/png',
          quality: 1.0,
        },
        progress: (key: string, current: number, total: number) => {
          setProgress(40 + Math.round((current / total) * 50)); // Progress from 40% to 90%
        },
      });

      setProgress(95);

      // Convert to white background
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d")!;
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const whiteBgUrl = canvas.toDataURL("image/png");
          setProcessedImage(whiteBgUrl);
        };
        img.src = URL.createObjectURL(processedBlob);
      } else {
        const processedUrl = URL.createObjectURL(processedBlob);
        setProcessedImage(processedUrl);
      }

      setProgress(100);
    } catch (error) {
      console.error("Error removing background:", error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };
=======
  const handleRemoveBackground = async () => {
    if (!image) return;

    setIsProcessing(true);
    setProgress(0);
    try {
      setProgress(20);

      // Convert image src to File object
      const response = await fetch(image.src);
      const blob = await response.blob();
      const file = new File([blob], "image.png", { type: blob.type });

      setProgress(40);

      // Use Gemini AI for background removal
      const { removeBackground } = await import("@/services/geminiService");
      const processedImageUrl = await removeBackground(file);

      setProgress(95);

      setProcessedImage(processedImageUrl);
      setProgress(100);
    } catch (error) {
      console.error("Error removing background:", error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };
