'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseSpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    lang = 'vi-VN',
    continuous = true,
    interimResults = true,
    onResult,
    onError
  } = options

  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const isManuallyStoppedRef = useRef(false)

  // Kiểm tra hỗ trợ Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      setIsSupported(Boolean(SpeechRecognition))
    }
  }, [])

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore if already stopped
      }
    }
    setIsListening(false)
  }, [])

  const startListening = useCallback((initialBaseText = '') => {
    if (typeof window === 'undefined') return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      const err = 'Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Web Speech API).'
      setErrorMessage(err)
      onError?.(err)
      return
    }

    setErrorMessage(null)
    isManuallyStoppedRef.current = false

    // Dừng phiên cũ nếu có
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = lang
      recognition.continuous = continuous
      recognition.interimResults = interimResults

      let accumulatedFinal = ''

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        let currentFinal = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0]?.transcript || ''
          if (event.results[i].isFinal) {
            currentFinal += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (currentFinal) {
          accumulatedFinal += (accumulatedFinal ? ' ' : '') + currentFinal.trim()
        }

        const totalSpoken = (accumulatedFinal + (interimTranscript ? (accumulatedFinal ? ' ' : '') + interimTranscript.trim() : '')).trim()

        const fullText = initialBaseText
          ? `${initialBaseText} ${totalSpoken}`
          : totalSpoken

        onResult?.(fullText, Boolean(currentFinal && !interimTranscript))
      }

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Bỏ qua lỗi không có tiếng nói khi vẫn đang lắng nghe
          return
        }
        if (event.error === 'not-allowed') {
          const err = 'Quyền truy cập Micro bị từ chối. Vui lòng cho phép quyền truy cập Micro trên trình duyệt.'
          setErrorMessage(err)
          onError?.(err)
        } else if (event.error === 'network') {
          const err = 'Lỗi kết nối mạng khi xử lý nhận diện giọng nói.'
          setErrorMessage(err)
          onError?.(err)
        } else {
          const err = `Lỗi nhận diện giọng nói: ${event.error || 'Không xác định'}`
          setErrorMessage(err)
          onError?.(err)
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        // Tự động khởi động lại nếu continuous và người dùng chưa bấm dừng thủ công
        if (continuous && !isManuallyStoppedRef.current) {
          try {
            recognition.start()
            return
          } catch (e) {}
        }
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err: any) {
      console.error('Error starting speech recognition:', err)
      const errStr = err?.message || 'Không thể khởi động micro'
      setErrorMessage(errStr)
      onError?.(errStr)
      setIsListening(false)
    }
  }, [lang, continuous, interimResults, onResult, onError])

  const toggleListening = useCallback((currentText = '') => {
    if (isListening) {
      stopListening()
    } else {
      startListening(currentText)
    }
  }, [isListening, startListening, stopListening])

  // Dọn dẹp khi unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (e) {}
      }
    }
  }, [])

  return {
    isListening,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    toggleListening
  }
}
