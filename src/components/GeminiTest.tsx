import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'

const GeminiTest: React.FC = () => {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const testGemini = async () => {
    if (!message.trim()) return

    setIsLoading(true)
    setStatus('idle')
    setError('')

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      })

      const data = await res.json()

      if (data.success) {
        setResponse(data.response)
        setStatus('success')
        if (data.fallback) {
          setError('Using fallback response (API may be offline)')
        }
      } else {
        setStatus('error')
        setError(data.error || 'Unknown error')
      }
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const testMessages = [
    "What are some good first date ideas?",
    "How do I start a conversation?",
    "I'm nervous about dating, any advice?",
    "What makes a good dating profile?"
  ]

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Gemini API Test</h2>
          <Badge variant="outline">Free Tier</Badge>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Campus Cupid AI anything..."
              onKeyPress={(e) => e.key === 'Enter' && testGemini()}
              disabled={isLoading}
            />
            <Button 
              onClick={testGemini} 
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Quick Test Buttons */}
          <div className="flex flex-wrap gap-2">
            {testMessages.map((testMsg, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setMessage(testMsg)}
                disabled={isLoading}
              >
                {testMsg}
              </Button>
            ))}
          </div>

          {/* Status */}
          {status !== 'idle' && (
            <div className="flex items-center gap-2">
              {status === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${
                status === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {status === 'success' ? 'Success!' : 'Error occurred'}
              </span>
              {error && (
                <span className="text-sm text-orange-600">({error})</span>
              )}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">AI Response:</h3>
              <p className="text-sm">{response}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Setup Instructions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Setup Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Get your free Gemini API key from <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></li>
          <li>Add <code className="bg-muted px-1 rounded">GEMINI_API_KEY=your_key_here</code> to your <code className="bg-muted px-1 rounded">.env.local</code> file</li>
          <li>Restart your development server</li>
          <li>Test the chatbot above!</li>
        </ol>
      </Card>
    </div>
  )
}

export default GeminiTest

