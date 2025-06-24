import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import LocalBibleDataService, { SearchFilters } from '../services/LocalBibleDataService';
import { BibleVerse, BookMetadata } from '../services/LocalBibleDataService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SolomonChatModal from '../components/SolomonChatModal';

// Add SearchSummary component
const SearchSummary = ({ results }: { results: any[] }) => {
  if (!results || results.length === 0) return null;

  // Calculate statistics
  const bookCounts = results.reduce((acc: Record<string, number>, verse) => {
    acc[verse.book] = (acc[verse.book] || 0) + 1;
    return acc;
  }, {});

  const totalVerses = results.length;
  const uniqueBooks = Object.keys(bookCounts).length;
  const mostFrequentBook = Object.entries(bookCounts)
    .sort(([, a], [, b]) => b - a)[0];

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Search Summary</Text>
      <Text style={styles.summaryText}>
        Found {totalVerses} verses across {uniqueBooks} books
      </Text>
      {mostFrequentBook && (
        <Text style={styles.summaryText}>
          Most frequent in {mostFrequentBook[0]} ({mostFrequentBook[1]} verses)
        </Text>
      )}
    </View>
  );
};

const SearchAnalysis = ({ results, searchQuery }: { results: any[], searchQuery: string }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const generateAnalysis = async () => {
    if (!isActive) {
      setIsActive(true);
      return;
    }
    
    setIsGenerating(true);
    try {
      // Group verses by book and chapter
      const groupedVerses = results.reduce((acc: Record<string, Record<number, any[]>>, verse) => {
        if (!acc[verse.book]) acc[verse.book] = {};
        if (!acc[verse.book][verse.chapter]) acc[verse.book][verse.chapter] = [];
        acc[verse.book][verse.chapter].push(verse);
        return acc;
      }, {});

      // Create a structured analysis
      let analysisText = `Analysis of "${searchQuery}" in the Bible:\n\n`;
      
      // Add overview
      analysisText += `Overview:\n`;
      analysisText += `• Total occurrences: ${results.length}\n`;
      analysisText += `• Books containing the term: ${Object.keys(groupedVerses).length}\n\n`;

      // Add book-by-book analysis
      analysisText += `Book-by-Book Analysis:\n`;
      Object.entries(groupedVerses).forEach(([book, chapters]) => {
        const totalInBook = Object.values(chapters).reduce((sum, verses) => sum + verses.length, 0);
        analysisText += `\n${book}:\n`;
        analysisText += `• Total occurrences: ${totalInBook}\n`;
        analysisText += `• Chapters containing the term: ${Object.keys(chapters).length}\n`;
        
        // Add key themes or patterns if available
        const firstVerse = Object.values(chapters)[0][0];
        if (firstVerse.theme) {
          analysisText += `• Key theme: ${firstVerse.theme}\n`;
        }
      });

      setAnalysis(analysisText);
    } catch (error) {
      console.error('Error generating analysis:', error);
      setAnalysis('Failed to generate analysis. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!results || results.length === 0) return null;

  return (
    <View style={styles.analysisContainer}>
      {!analysis && (
        <TouchableOpacity
          style={[
            styles.analysisButton,
            isActive && styles.analysisButtonActive
          ]}
          onPress={generateAnalysis}
          disabled={isGenerating}
        >
          <Text style={[
            styles.analysisButtonText,
            isActive && styles.analysisButtonTextActive
          ]}>
            {isGenerating ? 'Generating Analysis...' : 
             isActive ? 'Generate Analysis' : 'Click to Enable Analysis'}
          </Text>
        </TouchableOpacity>
      )}
      
      {analysis && (
        <View style={styles.analysisContent}>
          <Text style={styles.analysisTitle}>Search Analysis</Text>
          <Text style={styles.analysisText}>{analysis}</Text>
          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={generateAnalysis}
            disabled={isGenerating}
          >
            <Text style={styles.regenerateButtonText}>
              {isGenerating ? 'Regenerating...' : 'Regenerate Analysis'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const BookHeader = ({ book, chapter }: { book: string; chapter: number }) => (
  <View style={styles.bookHeader}>
    <Text style={styles.bookTitle}>{book}</Text>
    <Text style={styles.chapterTitle}>Chapter {chapter}</Text>
  </View>
);

const VerseText = ({ verse }: { verse: any }) => (
  <View style={styles.verseContainer}>
    <Text style={styles.verseNumber}>{verse.verse}</Text>
    <Text style={styles.verseText}>{verse.text}</Text>
  </View>
);

export default function BibleStudyScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [books, setBooks] = useState<string[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('Genesis');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [lemma, setLemma] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [useVerbForms, setUseVerbForms] = useState(false);
  const [isSearchingAllBooks, setIsSearchingAllBooks] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [currentVerses, setCurrentVerses] = useState<any[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(true);
  const [solomonVisible, setSolomonVisible] = useState(false);
  
  // Dropdown states
  const [bookOpen, setBookOpen] = useState(false);
  const [bookValue, setBookValue] = useState<string>('Genesis');
  const [bookItems, setBookItems] = useState<{label: string, value: string}[]>([]);

  // New state for modal visibility
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);

  const bibleService = LocalBibleDataService;

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (selectedBook) {
      loadChapters(selectedBook);
      loadVerses(selectedBook, selectedChapter);
    } else {
      setChapters([]);
    }
  }, [selectedBook, selectedChapter]);

  // Update dropdown items when books/chapters change
  useEffect(() => {
    setBookItems(books.map(book => ({ label: book, value: book })));
  }, [books]);

  // Sync dropdown values with selected values
  useEffect(() => {
    setBookValue(selectedBook);
  }, [selectedBook]);

  const saveSession = async (book: string, chapter: number) => {
    try {
      await AsyncStorage.setItem('lastBook', book);
      await AsyncStorage.setItem('lastChapter', chapter.toString());
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const loadVerses = async (book: string, chapter: number) => {
    setIsLoadingVerses(true);
    try {
      const verses = bibleService.getChapterVerses(book, chapter.toString());
      setCurrentVerses(verses);
      saveSession(book, chapter);
    } catch (error) {
      console.error('Error loading verses:', error);
      setFilterError('Failed to load verses. Please try again.');
    } finally {
      setIsLoadingVerses(false);
    }
  };

  const loadBooks = async () => {
    setIsLoadingFilters(true);
    setFilterError(null);
    try {
      const availableBooks = Object.keys(bibleService.getAllBooks());
      setBooks(availableBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      setFilterError('Failed to load books. Please try again.');
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const loadChapters = async (book: string) => {
    setIsLoadingFilters(true);
    setFilterError(null);
    try {
      const availableChapters = bibleService.getBookChapters(book);
      setChapters(availableChapters.map(ch => parseInt(ch)));
    } catch (error) {
      console.error('Error loading chapters:', error);
      setFilterError('Failed to load chapters. Please try again.');
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setFilterError(null);
    try {
      const filters: SearchFilters = {};
      
      // Only apply book/chapter filters if they are explicitly set
      if (selectedBook && selectedBook !== '') filters.book = selectedBook;
      if (selectedChapter !== null && selectedChapter !== 1) filters.chapter = selectedChapter.toString();

      console.log('Searching with filters:', filters);
      const results = bibleService.search(searchQuery, filters);
      console.log('Search results:', results.length);
      setSearchResults(results);
      
      // Remove the code that updates the books list based on search results
      // We want to keep the full list of books visible
    } catch (error) {
      console.error('Error searching verses:', error);
      setSearchResults([]);
      setFilterError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSelect = async (book: string) => {
    const newBook = book === selectedBook ? '' : book;
    setSelectedBook(newBook);
    setSelectedChapter(1);
    setIsSearchingAllBooks(false);
    
    // If there's an active search query, perform the search with the new book
    if (searchQuery.trim()) {
      setIsLoading(true);
      setFilterError(null);
      try {
        const filters: SearchFilters = {};
        if (newBook) filters.book = newBook;

        const results = bibleService.search(searchQuery, filters);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching verses:', error);
        setSearchResults([]);
        setFilterError('Search failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChapterSelect = async (chapter: number) => {
    const newChapter = chapter === selectedChapter ? 1 : chapter;
    setSelectedChapter(newChapter);
    setIsSearchingAllBooks(false);
    
    // If there's an active search query, perform the search with the new chapter
    if (searchQuery.trim()) {
      setIsLoading(true);
      setFilterError(null);
      try {
        const filters: SearchFilters = {};
        if (selectedBook) filters.book = selectedBook;
        if (newChapter) filters.chapter = newChapter.toString();

        const results = bibleService.search(searchQuery, filters);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching verses:', error);
        setSearchResults([]);
        setFilterError('Search failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const clearFilters = () => {
    setSelectedBook('Genesis');
    setSelectedChapter(1);
    setLemma('');
    setUseVerbForms(false);
    if (searchQuery.trim()) {
      handleSearch();
    }
  };

  const handleSearchAllBooks = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setFilterError(null);
    setIsSearchingAllBooks(true);
    try {
      const filters: SearchFilters = {};
      const results = bibleService.search(searchQuery, filters);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching verses:', error);
      setSearchResults([]);
      setFilterError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderVerse = ({ item }: { item: any }) => {
    if (searchQuery.trim()) {
      // Search result rendering
      const { reference, text, matches, book } = item;
      let parts = [];
      let lastIndex = 0;
      
      if (matches && matches.length > 0) {
        matches.forEach((match: any) => {
          if (match.start > lastIndex) {
            parts.push({
              text: text.substring(lastIndex, match.start),
              isMatch: false
            });
          }
          parts.push({
            text: match.text,
            isMatch: true
          });
          lastIndex = match.end;
        });
        
        if (lastIndex < text.length) {
          parts.push({
            text: text.substring(lastIndex),
            isMatch: false
          });
        }
      } else {
        parts = [{ text, isMatch: false }];
      }

      // Get book metadata from the service
      const bookMetadata = bibleService.getBookMetadata(book);
      if (!bookMetadata) {
        return null;
      }
      const authorText = bookMetadata.author || 'Unknown';
      const authorInfo = `${authorText} (${bookMetadata.yearWritten || 'Unknown'}) - ${bookMetadata.genre || 'Unknown'}`;

      return (
        <View style={styles.searchResultContainer}>
          <Text style={styles.reference}>{reference}</Text>
          <Text style={styles.authorInfo}>{authorInfo}</Text>
          <Text style={styles.verseText}>
            {parts.map((part, index) => (
              <Text
                key={index}
                style={[
                  styles.verseText,
                  part.isMatch && styles.highlightedText
                ]}
              >
                {part.text}
              </Text>
            ))}
          </Text>
        </View>
      );
    } else {
      // Regular verse rendering
      return <VerseText verse={item} />;
    }
  };

  const renderFilterSection = () => (
    <View style={styles.filterContainer}>
      {filterError && (
        <Text style={styles.errorText}>{filterError}</Text>
      )}
      
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Filters</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearFilters}
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bookScroll}>
        {isLoadingFilters ? (
          <ActivityIndicator size="small" color="#007AFF" style={styles.filterLoader} />
        ) : (
          <DropDownPicker
            open={bookOpen}
            value={bookValue}
            items={bookItems}
            setOpen={setBookOpen}
            setValue={setBookValue}
            setItems={setBookItems}
            placeholder="Select a book"
            style={styles.dropdownStyle}
            dropDownContainerStyle={styles.dropdownContainerStyle}
            textStyle={styles.dropdownTextStyle}
            labelStyle={styles.dropdownTextSelected}
            selectedItemLabelStyle={styles.dropdownTextSelected}
            onSelectItem={(item) => {
              if (item && item.value) {
                handleBookSelect(item.value);
              }
            }}
            zIndex={3000}
            zIndexInverse={1000}
          />
        )}
      </View>

      {selectedBook && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chapterScroll}
          contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          {isLoadingFilters ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.filterLoader} />
          ) : (
            chapters.map((chapter) => (
              <TouchableOpacity
                key={chapter}
                style={[
                  styles.filterButton,
                  selectedChapter === chapter && styles.selectedFilter
                ]}
                onPress={() => handleChapterSelect(chapter)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedChapter === chapter && styles.selectedFilterText
                ]}>{chapter}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            styles.searchAllButton,
            isSearchingAllBooks && styles.searchAllButtonActive
          ]}
          onPress={handleSearchAllBooks}
        >
          <Text style={[
            styles.filterButtonText,
            styles.searchAllButtonText,
            isSearchingAllBooks && styles.searchAllButtonTextActive
          ]}>Search All Books</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, styles.searchAllButton]}
          onPress={() => setSolomonVisible(true)}
        >
          <Text style={[styles.filterButtonText, styles.searchAllButtonText]}>Ask Solomon</Text>
        </TouchableOpacity>
      </View>
      <SolomonChatModal visible={solomonVisible} onClose={() => setSolomonVisible(false)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Bible..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={[styles.searchButton, styles.submitButton]}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            showFilters && styles.selectedFilter
          ]}
          onPress={() => setFiltersModalVisible(true)}
        >
          <Text style={[
            styles.filterButtonText,
            showFilters && styles.selectedFilterText
          ]}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Render the filter section inside a Modal */}
      <Modal
        visible={filtersModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFiltersModalVisible(false)}
      >
        <View style={styles.filtersModalOverlay}>
          <View style={styles.filtersModalContent}>
            {renderFilterSection()}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setFiltersModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {searchQuery.trim() && (
            <>
              <SearchSummary results={searchResults} />
              <SearchAnalysis results={searchResults} searchQuery={searchQuery} />
            </>
          )}
          {!searchQuery.trim() && selectedBook && (
            <BookHeader book={selectedBook} chapter={selectedChapter} />
          )}
          <FlatList
            data={searchQuery.trim() ? searchResults : currentVerses}
            renderItem={renderVerse}
            keyExtractor={(item) => item.reference || `${item.verse}`}
            style={styles.resultsList}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.noResults}>
                {isLoadingVerses ? 'Loading verses...' : 
                 searchQuery ? 'No results found' : 'Enter a search term'}
              </Text>
            }
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#fff',
  },
  searchButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  filterContainer: {
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  bookScroll: {
    marginBottom: 12,
  },
  chapterScroll: {
    marginBottom: 12,
    maxHeight: 50,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#F3F3F5',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFilter: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  filterButtonText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '700',
  },
  selectedFilterText: {
    color: '#007AFF',
    fontWeight: '700',
  },
  lemmaInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterLoader: {
    marginHorizontal: 8,
  },
  resultsList: {
    flex: 1,
    marginBottom: 16,
  },
  verseContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  verseNumber: {
    fontSize: 12,
    color: '#888',
    fontWeight: '400',
    marginRight: 2,
    marginTop: 2,
    lineHeight: 20,
    textAlignVertical: 'top',
    position: 'relative',
    top: -4,
  },
  verseText: {
    flex: 1,
    fontSize: 18,
    color: '#222',
    lineHeight: 28,
    fontFamily: 'serif',
    fontWeight: '400',
    letterSpacing: 0.1,
    textAlign: 'left',
    backgroundColor: 'transparent',
  },
  highlightedText: {
    backgroundColor: '#FFEB3B',
    color: '#000',
    fontWeight: 'bold',
  },
  noResults: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 32,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 8,
  },
  authorInfo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  summaryContainer: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookHeader: {
    backgroundColor: 'transparent',
    padding: 0,
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 0,
  },
  chapterTitle: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    fontWeight: '500',
  },
  searchResultContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchAllButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    paddingVertical: 12,
  },
  searchAllButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  searchAllButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchAllButtonTextActive: {
    color: '#fff',
  },
  analysisContainer: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  analysisButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  analysisButtonActive: {
    backgroundColor: '#4B0082',
    borderColor: '#4B0082',
  },
  analysisButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  analysisButtonTextActive: {
    color: '#fff',
  },
  analysisContent: {
    marginTop: 8,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 16,
  },
  regenerateButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  regenerateButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  reference: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  dropdownStyle: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 40,
    textAlign: 'center',
  },
  dropdownContainerStyle: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownTextStyle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  dropdownTextSelected: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filtersModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  closeModalButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  closeModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 