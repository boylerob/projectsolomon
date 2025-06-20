import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

// Import the enhanced lexicon
import enhancedLexicon from '../../assets/training_data/enhanced_lexicon.json';

interface Prayer {
  id: string;
  title: string;
  category: string;
  text: string;
  scripture?: string;
  author?: string;
}

interface PrayerCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface LexiconTerm {
  term: string;
  synonyms: string[];
  lemmas: string;
  definition: string;
}

const prayerCategories: PrayerCategory[] = [
  {
    id: 'gratitude',
    name: 'Gratitude & Thanksgiving',
    description: 'Prayers of thankfulness and appreciation',
    icon: '🙏',
  },
  {
    id: 'forgiveness',
    name: 'Forgiveness & Repentance',
    description: 'Prayers for forgiveness and spiritual renewal',
    icon: '🕊️',
  },
  {
    id: 'guidance',
    name: 'Guidance & Wisdom',
    description: 'Prayers for direction and divine wisdom',
    icon: '💡',
  },
  {
    id: 'healing',
    name: 'Healing & Comfort',
    description: 'Prayers for physical and emotional healing',
    icon: '❤️',
  },
  {
    id: 'strength',
    name: 'Strength & Courage',
    description: 'Prayers for inner strength and bravery',
    icon: '⚡',
  },
  {
    id: 'peace',
    name: 'Peace & Serenity',
    description: 'Prayers for inner peace and calm',
    icon: '🕊️',
  },
  {
    id: 'family',
    name: 'Family & Relationships',
    description: 'Prayers for loved ones and relationships',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'purpose',
    name: 'Purpose & Calling',
    description: 'Prayers for discovering God\'s plan',
    icon: '🎯',
  },
  {
    id: 'theological',
    name: 'Theological Terms',
    description: 'Prayers based on biblical concepts',
    icon: '📖',
  },
];

// Function to generate theological prayers from lexicon
const generateTheologicalPrayers = (): Prayer[] => {
  return (enhancedLexicon as LexiconTerm[]).map((term, index) => ({
    id: `theological-${index + 1}`,
    title: `Prayer for ${term.term}`,
    category: 'theological',
    text: `Lord, I come before You seeking to understand and experience ${term.term.toLowerCase()} in my life. ${term.definition} Help me to grow in this aspect of my faith and to reflect Your character more fully. May Your ${term.term.toLowerCase()} be evident in my thoughts, words, and actions. In Jesus' name, Amen.`,
    scripture: `Biblical concept: ${term.term} - ${term.lemmas}`,
    author: 'Based on theological lexicon',
  }));
};

const prayers: Prayer[] = [
  // Gratitude Prayers
  {
    id: 'gratitude-1',
    title: 'Morning Thanksgiving',
    category: 'gratitude',
    text: 'Gracious Father, I thank You for this new day and the gift of life. Thank You for Your love that never fails and Your mercies that are new every morning. Help me to see Your blessings throughout this day and to give thanks in all circumstances. In Jesus\' name, Amen.',
    scripture: 'Psalm 118:24 - "This is the day that the Lord has made; let us rejoice and be glad in it."',
  },
  {
    id: 'gratitude-2',
    title: 'Thankful Heart',
    category: 'gratitude',
    text: 'Lord, I come before You with a heart full of gratitude. Thank You for the air I breathe, the food I eat, the shelter over my head, and the people You have placed in my life. Most of all, thank You for Your Son Jesus Christ and the salvation You offer. Help me to live each day with a thankful heart. Amen.',
    scripture: '1 Thessalonians 5:18 - "Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus."',
  },
  
  // Forgiveness Prayers
  {
    id: 'forgiveness-1',
    title: 'Prayer of Repentance',
    category: 'forgiveness',
    text: 'Merciful God, I confess my sins before You. I have fallen short of Your glory and sinned against You. Please forgive me for my wrongdoings, both known and unknown. Create in me a clean heart, O God, and renew a right spirit within me. Help me to turn away from sin and walk in Your ways. In Jesus\' name, Amen.',
    scripture: 'Psalm 51:10 - "Create in me a clean heart, O God, and renew a right spirit within me."',
  },
  {
    id: 'forgiveness-2',
    title: 'Forgiving Others',
    category: 'forgiveness',
    text: 'Father, I bring before You the hurts and wrongs I have experienced. Help me to forgive those who have hurt me, just as You have forgiven me. Remove any bitterness or resentment from my heart. Give me the strength to love my enemies and pray for those who persecute me. Help me to reflect Your grace and mercy. Amen.',
    scripture: 'Matthew 6:14-15 - "For if you forgive others their trespasses, your heavenly Father will also forgive you."',
  },
  
  // Guidance Prayers
  {
    id: 'guidance-1',
    title: 'Seeking Wisdom',
    category: 'guidance',
    text: 'Lord, I need Your wisdom and guidance in my life. The decisions I face seem overwhelming, and I don\'t know which way to turn. Please give me clarity of mind and discernment to make the right choices. Lead me in the path You have prepared for me, and help me to trust in Your perfect plan. In Jesus\' name, Amen.',
    scripture: 'James 1:5 - "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault."',
  },
  {
    id: 'guidance-2',
    title: 'Divine Direction',
    category: 'guidance',
    text: 'Heavenly Father, I surrender my plans and desires to You. Guide my steps and direct my path according to Your will. Open doors that You want me to walk through and close those that would lead me astray. Help me to hear Your voice clearly and to follow where You lead. Amen.',
    scripture: 'Proverbs 3:5-6 - "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."',
  },
  
  // Healing Prayers
  {
    id: 'healing-1',
    title: 'Prayer for Healing',
    category: 'healing',
    text: 'Lord Jesus, You are the Great Physician. I come to You with my pain and suffering, asking for Your healing touch. Whether it be physical, emotional, or spiritual healing I need, I trust in Your power to restore me. Help me to find strength in my weakness and to glorify You through this trial. Amen.',
    scripture: 'Jeremiah 17:14 - "Heal me, Lord, and I will be healed; save me and I will be saved, for you are the one I praise."',
  },
  {
    id: 'healing-2',
    title: 'Comfort in Grief',
    category: 'healing',
    text: 'God of all comfort, I am hurting and my heart is heavy. Please wrap Your loving arms around me and bring me peace that surpasses understanding. Help me to find hope in the midst of sorrow and to trust that You are working all things for good. Thank You for being near to the brokenhearted. Amen.',
    scripture: 'Psalm 34:18 - "The Lord is close to the brokenhearted and saves those who are crushed in spirit."',
  },
  
  // Strength Prayers
  {
    id: 'strength-1',
    title: 'Strength for Today',
    category: 'strength',
    text: 'Lord, I feel weak and overwhelmed by the challenges before me. Please give me Your strength to face this day. Help me to remember that I can do all things through Christ who strengthens me. Fill me with Your power and courage to overcome every obstacle. In Jesus\' name, Amen.',
    scripture: 'Philippians 4:13 - "I can do all this through him who gives me strength."',
  },
  {
    id: 'strength-2',
    title: 'Courage to Persevere',
    category: 'strength',
    text: 'Father, when I want to give up, remind me of Your faithfulness. Give me the courage to keep going, even when the road is difficult. Help me to fix my eyes on Jesus and to run with perseverance the race marked out for me. Strengthen my faith and help me to trust in Your promises. Amen.',
    scripture: 'Hebrews 12:1-2 - "Let us run with perseverance the race marked out for us, fixing our eyes on Jesus."',
  },
  
  // Peace Prayers
  {
    id: 'peace-1',
    title: 'Peace in Chaos',
    category: 'peace',
    text: 'Prince of Peace, my world feels chaotic and my mind is restless. Please calm the storms within me and give me Your peace that transcends all understanding. Help me to be still and know that You are God. Let Your peace rule in my heart and mind. Amen.',
    scripture: 'John 14:27 - "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid."',
  },
  {
    id: 'peace-2',
    title: 'Serenity Prayer',
    category: 'peace',
    text: 'God, grant me the serenity to accept the things I cannot change, the courage to change the things I can, and the wisdom to know the difference. Help me to live one day at a time, enjoying one moment at a time, accepting hardships as the pathway to peace. Amen.',
    author: 'Reinhold Niebuhr',
  },
  
  // Family Prayers
  {
    id: 'family-1',
    title: 'Prayer for Family',
    category: 'family',
    text: 'Heavenly Father, I lift up my family to You. Protect us, guide us, and draw us closer to You and to each other. Help us to love one another as You have loved us. Give us patience, understanding, and grace in our relationships. May our home be filled with Your presence and peace. Amen.',
    scripture: 'Psalm 127:1 - "Unless the Lord builds the house, the builders labor in vain."',
  },
  {
    id: 'family-2',
    title: 'Prayer for Children',
    category: 'family',
    text: 'Lord, I pray for the children in my life. Protect them, guide them, and help them to grow in wisdom and stature. Give them hearts that seek after You and help them to make good choices. Surround them with godly influences and help me to be a positive example. Amen.',
    scripture: 'Proverbs 22:6 - "Start children off on the way they should go, and even when they are old they will not turn from it."',
  },
  
  // Purpose Prayers
  {
    id: 'purpose-1',
    title: 'Discovering Purpose',
    category: 'purpose',
    text: 'Lord, I want to know Your purpose for my life. Help me to understand the unique gifts and talents You have given me and how to use them for Your glory. Guide me to the path You have prepared for me and help me to walk in it faithfully. Show me how to serve You and others with my life. Amen.',
    scripture: 'Jeremiah 29:11 - "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."',
  },
  {
    id: 'purpose-2',
    title: 'Living for God\'s Glory',
    category: 'purpose',
    text: 'Father, help me to live each day for Your glory. Whether I eat or drink or whatever I do, may I do it all for the glory of God. Help me to be a light in this world, reflecting Your love and grace to others. Use my life to draw others closer to You. Amen.',
    scripture: '1 Corinthians 10:31 - "So whether you eat or drink or whatever you do, do it all for the glory of God."',
  },
  
  // Add theological prayers
  ...generateTheologicalPrayers(),
];

export const PrayerScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);

  const filteredPrayers = selectedCategory 
    ? prayers.filter(prayer => prayer.category === selectedCategory)
    : [];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedPrayer(null);
  };

  const handlePrayerSelect = (prayer: Prayer) => {
    setSelectedPrayer(prayer);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedPrayer(null);
  };

  const handleBackToPrayers = () => {
    setSelectedPrayer(null);
  };

  const renderCategories = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Prayer</Text>
      <Text style={styles.subtitle}>Choose a prayer category</Text>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.categoriesGrid}>
          {prayerCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategorySelect(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryDescription}>{category.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderPrayers = () => {
    const category = prayerCategories.find(cat => cat.id === selectedCategory);
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category?.name}</Text>
        </View>
        
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {filteredPrayers.map((prayer) => (
            <TouchableOpacity
              key={prayer.id}
              style={styles.prayerCard}
              onPress={() => handlePrayerSelect(prayer)}
            >
              <Text style={styles.prayerTitle}>{prayer.title}</Text>
              <Text style={styles.prayerPreview} numberOfLines={2}>
                {prayer.text}
              </Text>
              {prayer.scripture && (
                <Text style={styles.scripturePreview} numberOfLines={1}>
                  📖 {prayer.scripture}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPrayerDetail = () => {
    // Find the corresponding lexicon term for theological prayers
    const lexiconTerm = selectedPrayer?.category === 'theological' 
      ? (enhancedLexicon as LexiconTerm[]).find(term => 
          selectedPrayer.title.includes(term.term)
        )
      : null;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToPrayers} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedPrayer?.title}</Text>
        </View>
        
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.prayerDetailCard}>
            <Text style={styles.prayerText}>{selectedPrayer?.text}</Text>
            
            {selectedPrayer?.scripture && (
              <View style={styles.scriptureContainer}>
                <Text style={styles.scriptureLabel}>Scripture Reference:</Text>
                <Text style={styles.scriptureText}>{selectedPrayer.scripture}</Text>
              </View>
            )}
            
            {selectedPrayer?.author && (
              <View style={styles.authorContainer}>
                <Text style={styles.authorLabel}>Author:</Text>
                <Text style={styles.authorText}>{selectedPrayer.author}</Text>
              </View>
            )}

            {/* Show additional theological information for lexicon-based prayers */}
            {lexiconTerm && (
              <>
                <View style={styles.theologicalContainer}>
                  <Text style={styles.theologicalLabel}>Related Terms:</Text>
                  <Text style={styles.theologicalText}>
                    {lexiconTerm.synonyms.join(', ')}
                  </Text>
                </View>
                
                <View style={styles.definitionContainer}>
                  <Text style={styles.definitionLabel}>Definition:</Text>
                  <Text style={styles.definitionText}>{lexiconTerm.definition}</Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (selectedPrayer) {
    return renderPrayerDetail();
  } else if (selectedCategory) {
    return renderPrayers();
  } else {
    return renderCategories();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#333',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  prayerCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  prayerPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  scripturePreview: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  prayerDetailCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  prayerText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 20,
  },
  scriptureContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  scriptureLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  scriptureText: {
    fontSize: 14,
    color: '#1976d2',
    fontStyle: 'italic',
  },
  authorContainer: {
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
    padding: 12,
  },
  authorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 14,
    color: '#7b1fa2',
  },
  theologicalContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  theologicalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  theologicalText: {
    fontSize: 14,
    color: '#1976d2',
    fontStyle: 'italic',
  },
  definitionContainer: {
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
    padding: 12,
  },
  definitionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginBottom: 4,
  },
  definitionText: {
    fontSize: 14,
    color: '#7b1fa2',
  },
}); 