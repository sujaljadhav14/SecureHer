import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Sample articles data
const ARTICLES = [
  {
    id: '1',
    title: 'Why Women Need to Take Control of Their Finances',
    summary: 'Financial independence is an essential component of women  empowerment. This article explores practical steps to achieve financial autonomy.',
    author: 'Maya Sharma',
    date: 'March 1, 2025',
    readTime: '5 min read',
    image: require('../../assets/icon.png'),
    category: 'Personal Finance',
    likes: 85,
    bookmarked: true,
    content: `
# Why Women Need to Take Control of Their Finances

Financial independence is an essential component of women's empowerment. Regardless of your relationship status, age, or career stage, being in control of your finances gives you freedom, security, and options.

## The Current Reality

Despite progress in many areas, women still face unique financial challenges:

- The gender pay gap persists, with women earning less than men in equivalent positions
- Women often take career breaks to care for children or elderly family members
- Women typically live longer than men, meaning retirement savings need to last longer
- Many women still defer financial decisions to male partners or family members

## Why Financial Independence Matters

Financial independence doesn't necessarily mean extreme wealth. Rather, it means having:

1. **Control over your money** - understanding what comes in and goes out
2. **Emergency savings** - a buffer against unexpected events
3. **Retirement planning** - ensuring you're taken care of in later years
4. **Investment knowledge** - making your money work for you
5. **Decision-making power** - not depending on others for financial choices

## Practical Steps Toward Financial Control

### Start with Awareness
Track your income and expenses for a month. Use a notebook, spreadsheet, or budgeting app to record everything. This simple exercise often reveals surprising patterns.

### Create a Budget That Works
A budget isn't about restriction—it's about allocation. Decide in advance where your money should go, including:
- Essentials (housing, food, utilities)
- Savings and investments
- Debt repayment
- Discretionary spending

### Build an Emergency Fund
Aim to save 3-6 months of essential expenses in an easily accessible account. This provides security and options if you face unexpected challenges.

### Tackle Debt Strategically
If you have high-interest debt, prioritize paying it down while maintaining minimum payments on other debts.

### Start Investing—No Matter How Small
Many women delay investing because they think they need specialized knowledge or large sums of money. The truth is that starting small with index funds or systematic investment plans can build significant wealth over time.

### Continuously Educate Yourself
Financial literacy isn't taught in most schools, so it's up to you to learn. Books, podcasts, online courses, and community workshops are excellent resources.

## Taking the First Step

The journey to financial independence begins with a single step. Choose one area to focus on this week—whether that's tracking expenses, opening a savings account, or reading a book about investing.

Remember that financial empowerment isn't selfish—it's essential. When you're financially stable, you're better positioned to help others and create the life you want on your own terms.
    `
  },
  {
    id: '2',
    title: 'Starting Your Own Business with Limited Resources',
    summary: 'You dont need massive capital to start a business. Learn how women entrepreneurs are building successful companies from the ground up.',
    author: 'Priya Singh',
    date: 'February 15, 2025',
    readTime: '8 min read',
    image: require('../../assets/icon.png'),
    category: 'Entrepreneurship',
    likes: 124,
    bookmarked: false,
    content: `
# Starting Your Own Business with Limited Resources

Many aspiring entrepreneurs believe they need substantial capital to start a business. However, some of the most successful companies began with minimal resources and a lot of creativity. This is especially relevant for women entrepreneurs, who often face additional barriers in accessing traditional funding.

## Start with What You Have

The "bootstrap mindset" is about leveraging existing resources rather than waiting for ideal conditions. Consider:

- **Skills and expertise**: What can you offer without additional investment?
- **Network**: Who do you know that might be early customers or advocates?
- **Time**: Can you start your business as a side project while maintaining income?
- **Available tools**: What free or low-cost tools can help you build your business?

## Low-Cost Business Models to Consider

Several business models require minimal upfront investment:

### Service-Based Businesses
Offering services based on your expertise—whether consulting, writing, design, or coaching—requires little more than a computer and internet connection.

### Dropshipping
Sell products online without holding inventory. When customers place orders, you purchase items from a third party that ships directly to them.

### Digital Products
Create once, sell many times. Examples include e-books, online courses, templates, or digital art.

### Micro-Manufacturing
Start small with handcrafted products you can make at home, scaling as demand grows.

## Practical Steps to Get Started

### 1. Validate Your Idea First
Before investing time and resources, confirm there's a market for your offering:
- Conduct interviews with potential customers
- Create a landing page to gauge interest
- Offer a limited version of your product/service to test response

### 2. Focus on Revenue Generation
While traditional advice often emphasizes business plans and branding, prioritize activities that bring in revenue quickly:
- Secure pre-orders if possible
- Offer special pricing for early adopters
- Create a minimum viable product to start selling

### 3. Leverage Free and Low-Cost Tools
Numerous tools can help you operate professionally without major investment:
- Website builders with free tiers
- Social media for marketing
- Free CRM systems for customer management
- Low-cost accounting software

### 4. Build a Community Around Your Business
Word-of-mouth remains one of the most powerful (and affordable) marketing methods:
- Provide exceptional value to early customers
- Engage authentically on social platforms
- Participate in relevant online and community groups
- Collaborate with complementary businesses

## Overcoming Common Challenges

### Limited Time
Start with just 5-10 dedicated hours weekly. Consistency matters more than quantity.

### Lack of Technical Knowledge
Use user-friendly platforms and gradually learn necessary skills through free online resources.

### Self-Doubt
Connect with other entrepreneurs, particularly women business owners who can relate to your challenges.

### Balancing Quality and Cost
Focus on delivering excellent core value while keeping operations lean.

## Success Stories to Inspire You

Many successful companies started with minimal resources:

- **Sara Blakely** started Spanx with $5,000 of her savings
- **Gram Games** began with just $6,000 between five founders
- **Mailchimp** bootstrapped for years before becoming a billion-dollar company

## Take the First Step Today

Remember that entrepreneurship is a journey. Start small, learn continuously, and build incrementally. With creativity and persistence, limited resources can actually become an advantage—forcing innovation and efficient decision-making.

The most important step is simply to begin.
    `
  },
  {
    id: '3',
    title: 'Investment Options for Young Women Professionals',
    summary: 'Early career is the perfect time to begin building wealth. Discover the best investment options for young professionals.',
    author: 'Lakshmi Iyer',
    date: 'February 22, 2025',
    readTime: '6 min read',
    image: require('../../assets/icon.png'),
    category: 'Investing',
    likes: 97,
    bookmarked: true,
    content: `
# Investment Options for Young Women Professionals

As a young professional woman, you have a powerful advantage: time. Starting your investment journey early can significantly impact your financial future through the magic of compound growth. This guide explores suitable investment options for women in the early and middle stages of their careers.

## Why Start Investing Now?

Before diving into specific options, let's understand why early investing is particularly important for women:

- Women typically earn less over their lifetimes due to the wage gap and career breaks
- Women generally live longer than men, requiring more retirement savings
- Starting early allows more time to learn and grow comfortable with investing
- Compound interest works more powerfully over longer periods

## Building Your Investment Foundation

Before exploring specific investment vehicles, ensure you have these fundamentals in place:

### 1. Emergency Fund
Save 3-6 months of essential expenses in a high-yield savings account before significant investing.

### 2. Employer Retirement Match
If your employer offers matching contributions to a retirement plan, contribute enough to get the full match—it's essentially free money.

### 3. Debt Management
Prioritize paying off high-interest debt (particularly credit cards) while beginning your investment journey.

## Investment Options for Beginners

### Systematic Investment Plans (SIPs)
- **How it works**: Invest a fixed amount in mutual funds regularly (typically monthly)
- **Benefits**: Disciplined approach, rupee-cost averaging, start with as little as ₹500
- **Ideal for**: Building a consistent investment habit with minimal effort

### Index Funds
- **How it works**: Passive investments that track market indexes like Nifty 50
- **Benefits**: Low fees, built-in diversification, historically reliable long-term returns
- **Ideal for**: First-time investors seeking simplicity and broad market exposure

### Tax-Saving Investments
- **How it works**: Equity Linked Savings Schemes (ELSS) offer tax benefits under Section 80C
- **Benefits**: Tax deduction up to ₹1.5 lakh, potential for higher returns than traditional tax-saving options
- **Ideal for**: Tax optimization while building wealth

## Intermediate Investment Options

As your income grows and you gain confidence, consider these options:

### Direct Equity Investments
- **How it works**: Purchase shares of individual companies directly
- **Benefits**: Potential for high returns, ownership in businesses you believe in
- **Ideal for**: Investors willing to research companies and tolerate higher volatility

### Real Estate Investment
- **How it works**: Invest in residential or commercial properties, either directly or through REITs
- **Benefits**: Tangible assets, potential rental income, typically appreciates over time
- **Ideal for**: Portfolio diversification and those interested in passive income

### Public Provident Fund (PPF)
- **How it works**: Government-backed long-term savings scheme
- **Benefits**: Tax-free interest, sovereign guarantee, tax benefits on contributions
- **Ideal for**: Ultra-safe portion of your portfolio with tax advantages

## Crucial Investment Principles

Whatever options you choose, remember these principles:

### Diversification
Spread investments across different asset classes and sectors to reduce risk.

### Regular Reviews
Schedule quarterly reviews of your portfolio to ensure it remains aligned with your goals.

### Increasing Contributions
As your income grows, increase your investment amount proportionally.

### Long-Term Perspective
Market fluctuations are normal—focus on long-term performance rather than short-term volatility.

## Overcoming Common Barriers

### Fear of Making Mistakes
Start small and increase investments as you gain confidence. Remember that inaction (not investing at all) is often the costliest mistake.

### Information Overload
Begin with simple, widely-recommended investments like index funds while gradually expanding your knowledge.

### Time Constraints
Utilize automatic investing features and consider working with a financial advisor if your situation becomes complex.

## Taking the First Step

Investment journeys begin with a single step. Consider starting with a SIP in an index fund with an amount you're comfortable with, even if it's minimal. As your knowledge and comfort grow, you can diversify and optimize your portfolio.

Remember, the goal isn't to create the perfect investment strategy immediately, but to begin building habits and knowledge that will serve you throughout your financial journey.
    `
  },
  {
    id: '4',
    title: 'Budgeting Basics: Creating a Plan That Works for You',
    summary: 'A personalized budget is the foundation of financial wellness. Learn practical approaches to budgeting that you alll actually stick with.',
    author: 'Neha Kapoor',
    date: 'March 10, 2025',
    readTime: '7 min read',
    image: require('../../assets/icon.png'),
    category: 'Personal Finance',
    likes: 112,
    bookmarked: false,
    content: 'Full article content about budgeting basics...'
  },
  {
    id: '5',
    title: 'Understanding Gold as a Long-term Investment',
    summary: 'Gold has traditionally held cultural significance in Indian households. This article examines its role in a modern investment portfolio.',
    author: 'Anjali Mehta',
    date: 'February 5, 2025',
    readTime: '6 min read',
    image: require('../../assets/icon.png'),
    category: 'Investing',
    likes: 78,
    bookmarked: false,
    content: 'Full article content about gold investments...'
  },
  {
    id: '6',
    title: 'Financial Planning for Different Life Stages',
    summary: 'From early career to retirement, your financial priorities change. Learn how to adapt your financial strategy for each life stage.',
    author: 'Shweta Taneja',
    date: 'January 28, 2025',
    readTime: '8 min read',
    image: require('../../assets/icon.png'),
    category: 'Financial Planning',
    likes: 91,
    bookmarked: true,
    content: 'Full article content about life stage planning...'
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'personal-finance', name: 'Personal Finance' },
  { id: 'investing', name: 'Investing' },
  { id: 'entrepreneurship', name: 'Entrepreneurship' },
  { id: 'financial-planning', name: 'Financial Planning' },
  { id: 'saving', name: 'Saving' },
  { id: 'taxes', name: 'Taxes' }
];

const FinancialArticlesScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [saved, setSaved] = useState([]);
  
  useEffect(() => {
    fetchArticles();
  }, []);
  
  useEffect(() => {
    filterArticles();
  }, [selectedCategory, searchQuery]);
  
  const fetchArticles = async () => {
    try {
      setLoading(true);
      // In a real app, this would be an API call
      // For now, we'll simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setArticles(ARTICLES);
      // Get saved articles from user's bookmarks
      setSaved(ARTICLES.filter(article => article.bookmarked).map(article => article.id));
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filterArticles = () => {
    let filtered = [...ARTICLES];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category.toLowerCase() === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.summary.toLowerCase().includes(query) ||
        article.author.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query)
      );
    }
    
    setArticles(filtered);
  };
  
  const toggleSaved = (articleId) => {
    setSaved(prev => {
      if (prev.includes(articleId)) {
        return prev.filter(id => id !== articleId);
      } else {
        return [...prev, articleId];
      }
    });
  };
  
  const openArticle = (article) => {
    setSelectedArticle(article);
  };
  
  const closeArticle = () => {
    setSelectedArticle(null);
  };
  
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  const renderArticleItem = ({ item }) => (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={() => openArticle(item)}
    >
      <Image source={item.image} style={styles.articleImage} />
      <View style={styles.articleContent}>
        <View style={styles.articleHeader}>
          <Text style={styles.articleCategory}>{item.category}</Text>
          <TouchableOpacity onPress={() => toggleSaved(item.id)}>
            <Ionicons
              name={saved.includes(item.id) ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={saved.includes(item.id) ? '#FFB5D8' : '#666'}
            />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.articleTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.articleSummary} numberOfLines={3}>{item.summary}</Text>
        
        <View style={styles.articleMeta}>
          <Text style={styles.articleAuthor}>{item.author}</Text>
          <View style={styles.articleStats}>
            <Text style={styles.articleDate}>{item.date}</Text>
            <View style={styles.dot} />
            <Text style={styles.articleReadTime}>{item.readTime}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderArticleDetail = () => {
    if (!selectedArticle) return null;
    
    return (
      <View style={styles.articleDetailContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Image source={selectedArticle.image} style={styles.articleDetailImage} />
          
          <View style={styles.articleDetailContent}>
            <View style={styles.articleDetailHeader}>
              <Text style={styles.articleDetailCategory}>{selectedArticle.category}</Text>
              <View style={styles.articleDetailMeta}>
                <Text style={styles.articleDetailDate}>{selectedArticle.date}</Text>
                <View style={styles.dot} />
                <Text style={styles.articleDetailReadTime}>{selectedArticle.readTime}</Text>
              </View>
            </View>
            
            <Text style={styles.articleDetailTitle}>{selectedArticle.title}</Text>
            <View style={styles.authorContainer}>
              <Text style={styles.byLine}>By </Text>
              <Text style={styles.articleDetailAuthor}>{selectedArticle.author}</Text>
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => toggleSaved(selectedArticle.id)}
              >
                <Ionicons
                  name={saved.includes(selectedArticle.id) ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={saved.includes(selectedArticle.id) ? '#FFB5D8' : '#666'}
                />
                <Text style={styles.actionText}>
                  {saved.includes(selectedArticle.id) ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-social-outline" size={20} color="#666" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.articleDetailContent}>
              {selectedArticle.content}
            </Text>
          </View>
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.backToListButton}
          onPress={closeArticle}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" />
          <Text style={styles.backToListText}>Back to Articles</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Financial Articles</Text>
        <TouchableOpacity onPress={() => setSaved([])}>
          <Ionicons name="bookmark" size={24} color="#FFB5D8" />
        </TouchableOpacity>
      </View>

      {selectedArticle ? (
        renderArticleDetail()
      ) : (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search articles..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearSearch}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <FlatList
            horizontal
            data={CATEGORIES}
            renderItem={renderCategoryItem}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFB5D8" />
              <Text style={styles.loadingText}>Loading articles...</Text>
            </View>
          ) : (
            <FlatList
              data={articles}
              renderItem={renderArticleItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.articlesList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={64} color="#DDD" />
                  <Text style={styles.emptyText}>No articles found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your search or category filters</Text>
                </View>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearSearch: {
    padding: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 8,
  },
  selectedCategoryItem: {
    backgroundColor: '#FFB5D8',
  },
  categoryText: {
    color: '#666',
  },
  selectedCategoryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  articlesList: {
    padding: 16,
  },
  articleCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  articleContent: {
    padding: 16,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  articleCategory: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#666',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  articleSummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  articleAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  articleStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleDate: {
    fontSize: 12,
    color: '#999',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    marginHorizontal: 6,
  },
  articleReadTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  articleDetailContainer: {
    flex: 1,
  },
  articleDetailImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  articleDetailContent: {
    padding: 16,
  },
  articleDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  articleDetailCategory: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#666',
  },
  articleDetailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleDetailDate: {
    fontSize: 12,
    color: '#999',
  },
  articleDetailReadTime: {
    fontSize: 12,
    color: '#999',
  },
  articleDetailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 32,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  byLine: {
    fontSize: 14,
    color: '#666',
  },
  articleDetailAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 16,
  },
  articleDetailBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  backToListButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#FFB5D8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  backToListText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default FinancialArticlesScreen;