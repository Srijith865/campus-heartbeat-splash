import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  id: string
  username: string
  main_photo_url?: string
  bio?: string
  age?: number
  gender?: string
  interests?: string[]
  score: number
  matchType: 'exact' | 'partial' | 'fuzzy'
}

interface SearchDropdownProps {
  onProfileSelect: (profileId: string, username: string) => void
  className?: string
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ onProfileSelect, className = '' }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      await performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
        setIsOpen(data.results.length > 0)
        setSelectedIndex(-1)
      } else {
        setResults([])
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleResultClick = (result: SearchResult) => {
    onProfileSelect(result.id, result.username)
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'exact': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'partial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'fuzzy': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search by username, interests, or bio..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
          className="pl-10"
        />
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <Card className="max-h-80 overflow-y-auto shadow-lg border-2 border-primary/20">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Searching...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedIndex === index 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Profile Image */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {result.main_photo_url ? (
                            <img
                              src={result.main_photo_url}
                              alt={result.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {result.username}
                            </h4>
                            {result.age && (
                              <span className="text-xs text-muted-foreground">
                                {result.age}
                              </span>
                            )}
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getMatchTypeColor(result.matchType)}`}
                            >
                              {result.matchType}
                            </Badge>
                          </div>
                          
                          {result.bio && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {result.bio}
                            </p>
                          )}
                        </div>

                        {/* Arrow Icon */}
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : query.trim() && !isLoading ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">No profiles found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : null}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SearchDropdown

